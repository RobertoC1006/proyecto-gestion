-- Aditiva. El histórico sintético NO se inserta en Ticket.
CREATE TABLE "DemandConfig" (
 "institutionId" uuid PRIMARY KEY REFERENCES "Institution"("id") ON DELETE RESTRICT,
 "weeklyCapacity" integer NOT NULL DEFAULT 350 CHECK ("weeklyCapacity" BETWEEN 1 AND 1000000),
 "observedFrom" date, "version" integer NOT NULL DEFAULT 1 CHECK ("version">0),
 "updatedAt" timestamptz(3) NOT NULL
);
CREATE TABLE "ForecastRun" (
 "id" uuid PRIMARY KEY, "institutionId" uuid NOT NULL REFERENCES "Institution"("id") ON DELETE RESTRICT,
 "source" varchar(20) NOT NULL CHECK ("source" IN ('synthetic','operational')),
 "kind" varchar(20) NOT NULL CHECK ("kind" IN ('forecast','evaluate')),
 "slot" varchar(80) NOT NULL, "origin" date NOT NULL,
 "status" varchar(20) NOT NULL DEFAULT 'queued' CHECK ("status" IN ('queued','running','completed','failed','unavailable')),
 "result" jsonb, "errorCode" varchar(40), "attempts" integer NOT NULL DEFAULT 0,
 "createdAt" timestamptz(3) NOT NULL DEFAULT now(), "finishedAt" timestamptz(3)
);
CREATE UNIQUE INDEX "ForecastRun_institutionId_source_kind_slot_key" ON "ForecastRun"("institutionId","source","kind","slot");
CREATE INDEX "ForecastRun_institutionId_source_status_createdAt_idx" ON "ForecastRun"("institutionId","source","status","createdAt" DESC);
ALTER TABLE "DemandConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ForecastRun" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF EXISTS (SELECT FROM pg_roles WHERE rolname='campusitsm_api') THEN
  GRANT SELECT,INSERT,UPDATE ON "DemandConfig","ForecastRun" TO campusitsm_api;
  CREATE POLICY campusitsm_server ON "DemandConfig" FOR ALL TO campusitsm_api USING (true) WITH CHECK (true);
  CREATE POLICY campusitsm_server ON "ForecastRun" FOR ALL TO campusitsm_api USING (true) WITH CHECK (true);
 END IF;
 IF EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON "DemandConfig","ForecastRun" FROM anon; END IF;
 IF EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON "DemandConfig","ForecastRun" FROM authenticated; END IF;
END $$;
