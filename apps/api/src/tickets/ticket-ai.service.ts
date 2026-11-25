import { Injectable } from '@nestjs/common';
import { Prisma, Ticket } from '@prisma/client';
import { AcademicService } from '../academic/academic.service';
import { PrismaService } from '../database/prisma.service';
import { calculate, defaultRules, policyInput } from './priority';
import { AiClassificationError, classifyWithGroq, GROQ_ADAPTER_VERSION, GROQ_MODEL } from './groq-ticket.adapter';

const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));

@Injectable()
export class TicketAiService {
  constructor(private readonly db: PrismaService, private readonly academic: AcademicService) {}

  async classify(ticket: Ticket): Promise<Ticket> {
    const started = Date.now();
    let proposal: Awaited<ReturnType<typeof classifyWithGroq>> | undefined;
    let failureCode: string | null = null;
    try { proposal = await classifyWithGroq(ticket.description); }
    catch (error) { failureCode = error instanceof AiClassificationError ? error.code : 'unavailable'; }

    try {
      return await this.db.$transaction(async tx => {
        await tx.$queryRaw`SELECT "id" FROM "Ticket" WHERE "id"=${ticket.id}::uuid FOR UPDATE`;
        const current = await tx.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
        // Una corrección humana o un reintento no puede ser sustituido por la respuesta de la IA.
        if (current.version !== ticket.version || current.classificationStatus !== 'pendiente') return current;
        const metadata = { aiProvider: 'groq', aiModel: GROQ_MODEL, aiAdapterVersion: GROQ_ADAPTER_VERSION,
          aiLatencyMs: Math.max(0, Date.now() - started), aiEvaluatedAt: new Date() };
        if (!proposal) return tx.ticket.update({ where: { id: ticket.id }, data: {
          ...metadata, classificationStatus: 'revision_manual', aiFailureCode: failureCode ?? 'unavailable',
          version: { increment: 1 },
        } });
        const context = await this.academic.context(current.institutionId, current.ownerId,
          current.courseId, current.sectionId, current.createdAt, tx);
        const policy = await tx.workflowPolicy.findUnique({ where: { institutionId: current.institutionId } });
        const result = calculate(proposal.urgency, proposal.impact, context.factor,
          policy ? policyInput(policy.rules) : defaultRules);
        return tx.ticket.update({ where: { id: ticket.id }, data: {
          ...metadata, service: proposal.service, reportedService: current.reportedService ?? current.service,
          classificationStatus: 'ia', aiExplanation: proposal.explanation, aiFailureCode: null,
          urgency: proposal.urgency, impact: proposal.impact, academicFactor: context.factor,
          academicContext: json(context), technicalScore: result.technicalScore, score: result.score,
          priority: result.rule.priority, policyVersion: policy?.version ?? 0,
          responseDueAt: new Date(current.createdAt.getTime() + result.rule.responseMinutes * 60000),
          resolutionDueAt: new Date(current.createdAt.getTime() + result.rule.resolutionMinutes * 60000),
          version: { increment: 1 },
        } });
      });
    } catch {
      // El ticket ya existe. Un fallo de contexto o política deriva a TI sin pisar cambios humanos.
      await this.db.ticket.updateMany({ where: { id: ticket.id, version: ticket.version,
        classificationStatus: 'pendiente' }, data: { classificationStatus: 'revision_manual',
        aiFailureCode: 'unavailable', aiProvider: 'groq', aiModel: GROQ_MODEL,
        aiAdapterVersion: GROQ_ADAPTER_VERSION, aiLatencyMs: Math.max(0, Date.now() - started),
        aiEvaluatedAt: new Date(), version: { increment: 1 } } });
      return this.db.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
    }
  }
}
