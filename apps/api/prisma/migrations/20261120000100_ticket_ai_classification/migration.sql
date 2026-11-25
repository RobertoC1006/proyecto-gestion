-- Clasificación de incidencias. Aplicar inicialmente solo a PostgreSQL local.
ALTER TYPE "TicketClassificationStatus" ADD VALUE IF NOT EXISTS 'ia';
ALTER TYPE "TicketClassificationStatus" ADD VALUE IF NOT EXISTS 'revision_manual';

ALTER TABLE "Ticket"
  ADD COLUMN "reportedService" "TicketService",
  ADD COLUMN "aiProvider" VARCHAR(32),
  ADD COLUMN "aiModel" VARCHAR(80),
  ADD COLUMN "aiAdapterVersion" VARCHAR(24),
  ADD COLUMN "aiExplanation" VARCHAR(1000),
  ADD COLUMN "aiFailureCode" VARCHAR(40),
  ADD COLUMN "aiLatencyMs" INTEGER,
  ADD COLUMN "aiEvaluatedAt" TIMESTAMPTZ(3),
  ADD CONSTRAINT "Ticket_ai_latency_nonnegative" CHECK ("aiLatencyMs" IS NULL OR "aiLatencyMs" >= 0);

UPDATE "Ticket" SET "reportedService" = "service" WHERE "reportedService" IS NULL;
