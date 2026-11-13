-- Flujo autorizado por Roberto. Aditivo: conserva tickets, identidades e historia.
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'en_atencion';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'resuelto';
ALTER TYPE "TicketClassificationStatus" ADD VALUE IF NOT EXISTS 'manual';
ALTER TABLE "AcademicEvent" ADD COLUMN "createdById" UUID;
ALTER TABLE "Ticket"
 ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
 ADD COLUMN "urgency" INTEGER, ADD COLUMN "impact" INTEGER,
 ADD COLUMN "academicFactor" DOUBLE PRECISION, ADD COLUMN "academicContext" JSONB,
 ADD COLUMN "technicalScore" INTEGER, ADD COLUMN "score" DOUBLE PRECISION,
 ADD COLUMN "priority" VARCHAR(2), ADD COLUMN "policyVersion" INTEGER,
 ADD COLUMN "responseDueAt" TIMESTAMPTZ(3), ADD COLUMN "resolutionDueAt" TIMESTAMPTZ(3),
 ADD COLUMN "firstResponseAt" TIMESTAMPTZ(3), ADD COLUMN "resolvedAt" TIMESTAMPTZ(3),
 ADD COLUMN "assigneeId" UUID, ADD COLUMN "solution" TEXT,
 ADD COLUMN "failureConfirmed" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false,
 ADD CONSTRAINT "Ticket_evaluation_range" CHECK (("urgency" IS NULL OR "urgency" BETWEEN 1 AND 3) AND ("impact" IS NULL OR "impact" BETWEEN 1 AND 3)),
 ADD CONSTRAINT "Ticket_priority_valid" CHECK ("priority" IS NULL OR "priority" IN ('P1','P2','P3','P4')),
 ADD CONSTRAINT "Ticket_assignee_scope" FOREIGN KEY ("institutionId","assigneeId") REFERENCES "AppUser"("institutionId","id") ON DELETE RESTRICT,
 ADD CONSTRAINT "Ticket_factor_valid" CHECK ("academicFactor" IS NULL OR "academicFactor" IN (1,1.5,1.7,2));
CREATE INDEX "Ticket_queue_idx" ON "Ticket"("institutionId","status","score" DESC,"createdAt");
CREATE TABLE "TicketChange" (
 "id" UUID PRIMARY KEY, "ticketId" UUID NOT NULL REFERENCES "Ticket"("id") ON DELETE RESTRICT,
 "institutionId" UUID NOT NULL REFERENCES "Institution"("id") ON DELETE RESTRICT,
 "actorId" UUID NOT NULL, "action" VARCHAR(40) NOT NULL, "note" VARCHAR(2000) NOT NULL,
 "before" JSONB, "after" JSONB, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "TicketChange_actor_scope" FOREIGN KEY ("institutionId","actorId") REFERENCES "AppUser"("institutionId","id") ON DELETE RESTRICT
);
CREATE INDEX "TicketChange_institutionId_ticketId_createdAt_idx" ON "TicketChange"("institutionId","ticketId","createdAt");
CREATE TABLE "WorkflowPolicy" (
 "institutionId" UUID PRIMARY KEY REFERENCES "Institution"("id") ON DELETE RESTRICT,
 "rules" JSONB NOT NULL, "version" INTEGER NOT NULL DEFAULT 1,
 "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $block$
DECLARE item text;
BEGIN
 FOREACH item IN ARRAY ARRAY['TicketChange','WorkflowPolicy'] LOOP
  EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',item);
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN EXECUTE format('REVOKE ALL ON %I FROM anon, authenticated',item); END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='campusitsm_api') THEN
   EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',item);
   EXECUTE format('CREATE POLICY campusitsm_server ON %I FOR ALL TO campusitsm_api USING (true) WITH CHECK (true)',item);
   EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON %I TO campusitsm_api',item);
  END IF;
 END LOOP;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='campusitsm_api') THEN
  REVOKE UPDATE,DELETE ON "TicketChange" FROM campusitsm_api;
 END IF;
END $block$;
