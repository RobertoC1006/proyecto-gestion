import { Injectable } from '@nestjs/common';
import { Prisma, Ticket } from '@prisma/client';
import { AcademicService } from '../academic/academic.service';
import { PrismaService } from '../database/prisma.service';
import { calculate, defaultRules, policyInput } from './priority';
import { AiClassificationError, classifyWithGroq, GROQ_ADAPTER_VERSION, GROQ_MODEL, TicketProposal } from './groq-ticket.adapter';

const snapshot = (ticket: Ticket): Prisma.InputJsonValue => JSON.parse(JSON.stringify({
  service: ticket.service, classificationStatus: ticket.classificationStatus,
  urgency: ticket.urgency, impact: ticket.impact, academicFactor: ticket.academicFactor,
  technicalScore: ticket.technicalScore, score: ticket.score, priority: ticket.priority,
  responseDueAt: ticket.responseDueAt, resolutionDueAt: ticket.resolutionDueAt,
  version: ticket.version, aiFailureCode: ticket.aiFailureCode,
}));

@Injectable()
export class TicketAiService {
  constructor(private readonly db: PrismaService, private readonly academic: AcademicService) {}

  async classify(ticket: Ticket): Promise<Ticket> {
    const started = Date.now();
    let proposal: TicketProposal | undefined;
    let failureCode: string | null = null;
    try { proposal = await classifyWithGroq(ticket.description); }
    catch (error) { failureCode = error instanceof AiClassificationError ? error.code : 'unavailable'; }
    try { return await this.commit(ticket, started, proposal, failureCode); }
    catch {
      // Contexto/politica fallidos: la misma transaccion de revision conserva historial.
      return this.commit(ticket, started, undefined, 'unavailable');
    }
  }

  private commit(ticket: Ticket, started: number, proposal?: TicketProposal, failureCode?: string | null) {
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Ticket" WHERE "id"=${ticket.id}::uuid AND "institutionId"=${ticket.institutionId}::uuid FOR UPDATE`;
      const current = await tx.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
      if (current.version !== ticket.version || current.classificationStatus !== 'pendiente') return current;
      const patch: Prisma.TicketUncheckedUpdateInput = {
        aiProvider: 'groq', aiModel: GROQ_MODEL, aiAdapterVersion: GROQ_ADAPTER_VERSION,
        aiLatencyMs: Math.max(0, Date.now() - started), aiEvaluatedAt: new Date(),
        classificationStatus: 'revision_manual', aiFailureCode: failureCode ?? 'unavailable',
        version: { increment: 1 },
      };
      if (proposal) {
        const context = await this.academic.context(current.institutionId, current.ownerId, current.courseId, current.sectionId, current.createdAt, tx);
        const policy = await tx.workflowPolicy.findUnique({ where: { institutionId: current.institutionId } });
        const result = calculate(proposal.urgency, proposal.impact, context.factor, policy ? policyInput(policy.rules) : defaultRules);
        Object.assign(patch, {
          service: proposal.service, reportedService: current.reportedService ?? current.service,
          classificationStatus: 'ia', aiExplanation: proposal.explanation, aiFailureCode: null,
          urgency: proposal.urgency, impact: proposal.impact, academicFactor: context.factor,
          academicContext: JSON.parse(JSON.stringify(context)), technicalScore: result.technicalScore,
          score: result.score, priority: result.rule.priority, policyVersion: policy?.version ?? 0,
          responseDueAt: new Date(current.createdAt.getTime() + result.rule.responseMinutes * 60000),
          resolutionDueAt: new Date(current.createdAt.getTime() + result.rule.resolutionMinutes * 60000),
        });
      }
      const updated = await tx.ticket.update({ where: { id: current.id }, data: patch });
      await tx.ticketChange.create({ data: {
        ticketId: current.id, institutionId: current.institutionId, actorId: null,
        action: proposal ? 'ai.classify' : 'ai.fallback',
        note: proposal ? 'Clasificación automática propuesta por Groq; revisable por TI.' : 'Clasificación derivada a revisión manual.',
        before: snapshot(current), after: snapshot(updated),
      } });
      return updated;
    });
  }
}
