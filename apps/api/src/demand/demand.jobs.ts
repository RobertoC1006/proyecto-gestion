import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { PgBoss } from "pg-boss";
import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaService } from "../database/prisma.service";
import { DemandService } from "./demand.service";
import { addDays, limaDay, Source } from "./demand.types";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class DemandJobs implements OnApplicationBootstrap, OnModuleDestroy {
  private boss?: PgBoss;
  private pool?: Pool;
  private timer?: NodeJS.Timeout;
  private sweeping = false;
  constructor(
    private readonly db: PrismaService,
    private readonly demand: DemandService,
    private readonly notifications: NotificationsService,
  ) {}
  async onApplicationBootstrap() {
    if (process.env.CAMPUS_JOBS_ENABLED === "0" || !process.env.DATABASE_URL)
      return;
    const url = new URL(process.env.DATABASE_URL!);
    // Reutiliza el destino validado por Prisma, manteniendo TLS estricto y credencial de API.
    const ssl =
      url.hostname === "db"
        ? undefined
        : {
            rejectUnauthorized: true,
            ca: readFileSync(
              join(process.cwd(), "prisma/certs/supabase-ca.crt"),
              "utf8",
            ),
          };
    this.pool = new Pool({
      host: url.hostname,
      port: Number(url.port),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
      ssl,
      max: 2,
      application_name: "campusitsm-jobs",
    });
    this.boss = new PgBoss({
      schema: "campusitsm",
      migrate: false,
      createSchema: false,
      persistQueueStats: false,
      persistWarnings: false,
      db: {
        executeSql: async (text, values) => {
          const r = await this.pool!.query(text, values);
          return {
            rows: Array.isArray(r)
              ? r.flatMap((part) => part.rows || [])
              : r.rows || [],
          };
        },
      },
    });
    this.boss.on("error", (error: Error & { code?: string }) => {
      const detail = error.message.match(
        /permission denied for (?:table|schema|function|relation) [\w.() ]+|must be owner of [\w. ]+|column [\w".]+ does not exist|relation "[\w.]+" does not exist/,
      );
      const diagnostic = error.code?.match(/^[A-Z0-9]{5}$/)
        ? error.message
            .replace(/'[^']*'/g, "[valor]")
            .replace(/postgres(?:ql)?:\/\/\S+/gi, "[conexión]")
            .slice(0, 220)
        : "revisar trabajador persistente";
      console.error(
        "CAMPUS_JOBS_RETRY",
        error.code?.match(/^[A-Z0-9_]+$/)?.[0] || "UNKNOWN",
        detail?.[0] || diagnostic,
      );
    });
    await this.boss.start();
    await this.boss.work<{ runId: string }>(
      "campus-demand",
      { batchSize: 1, pollingIntervalSeconds: 2 },
      async (jobs) => {
        for (const job of jobs) {
          await this.demand.execute(job.data.runId);
          await this.notifications.updateAlerts(job.data.runId);
          await this.notifications.process();
        }
      },
    );
    await this.boss.work("campus-daily", async () => {
      await this.scheduleDue("forecast");
    });
    await this.boss.work("campus-weekly", async () => {
      await this.scheduleDue("evaluate");
    });
    await this.boss.work("campus-notices", async () => {
      await this.notifications.scanSla();
      await this.notifications.process();
    });
    await this.boss.schedule(
      "campus-daily",
      "0 6 * * *",
      {},
      { tz: "America/Lima", missed: "once" },
    );
    await this.boss.schedule(
      "campus-weekly",
      "0 2 * * 0",
      {},
      { tz: "America/Lima", missed: "once" },
    );
    await this.boss.schedule(
      "campus-notices",
      "* * * * *",
      {},
      { tz: "America/Lima", missed: "once" },
    );
    await this.boss.send("campus-notices", {}, { singletonKey: "initial" });
    await this.catchUp();
    this.timer = setInterval(() => {
      void this.catchUp().catch(() => console.error("CAMPUS_JOBS_SWEEP_RETRY"));
    }, 30000);
    this.timer.unref();
  }
  async scheduleDue(kind: "forecast" | "evaluate", at = new Date()) {
    const institutions = await this.db.institution.findMany({
        select: { id: true },
      }),
      day = limaDay(at);
    const local = new Date(at.getTime() - 5 * 3600000);
    let origin = day;
    if (kind === "forecast" && local.getUTCHours() < 6)
      origin = addDays(day, -1);
    if (kind === "evaluate") {
      let days = local.getUTCDay();
      if (days === 0 && local.getUTCHours() < 2) days = 7;
      origin = addDays(day, -days);
    }
    for (const institution of institutions)
      for (const source of ["operational", "synthetic"] as Source[]) {
        // El sintético es opt-in: una corrida manual lo habilita para esta institución.
        if (
          source === "synthetic" &&
          !(await this.db.forecastRun.findFirst({
            where: { institutionId: institution.id, source },
          }))
        )
          continue;
        await this.demand.ensure(
          institution.id,
          source,
          kind,
          `${kind}:${origin}`,
          origin,
        );
      }
  }
  async catchUp() {
    if (!this.boss || this.sweeping) return;
    this.sweeping = true;
    try {
      await this.scheduleDue("evaluate");
      await this.scheduleDue("forecast");
      const rows = await this.db.forecastRun.findMany({
        where: {
          OR: [
            { status: "queued" },
            { status: "failed", attempts: { lt: 3 } },
            {
              status: "running",
              createdAt: { lt: new Date(Date.now() - 5 * 60000) },
            },
          ],
        },
        take: 100,
        orderBy: { createdAt: "asc" },
      });
      for (const run of rows)
        await this.boss.send(
          "campus-demand",
          { runId: run.id },
          {
            singletonKey: run.id,
            retryLimit: 2,
            retryDelay: 30,
            expireInSeconds: 240,
          },
        );
    } finally {
      this.sweeping = false;
    }
  }
  async dispatch() {
    await this.catchUp();
  }
  async refreshAlerts(institutionId: string) {
    for (const source of ["operational", "synthetic"]) {
      const run = await this.db.forecastRun.findFirst({
        where: { institutionId, source, status: "completed" },
        orderBy: [{ origin: "desc" }, { finishedAt: "desc" }],
      });
      if (run) await this.notifications.updateAlerts(run.id);
    }
    await this.notifications.process();
  }
  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.boss?.stop({ graceful: true, timeout: 10000 });
    await this.pool?.end();
  }
}
