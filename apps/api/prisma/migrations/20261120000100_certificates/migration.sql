-- Constancias emitidas de tickets resueltos y verificaciones mínimas públicas.
CREATE TABLE "Certificate" (
  "id" UUID NOT NULL,
  "institutionId" UUID NOT NULL,
  "ticketId" UUID NOT NULL,
  "ownerId" UUID NOT NULL,
  "code" VARCHAR(64) NOT NULL,
  "ticketCode" VARCHAR(40) NOT NULL,
  "service" "TicketService" NOT NULL,
  "resolvedAt" TIMESTAMPTZ(3) NOT NULL,
  "issuedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sha256" CHAR(64) NOT NULL,
  "storageKey" VARCHAR(120) NOT NULL,
  CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Certificate_ticketId_key" UNIQUE ("ticketId"),
  CONSTRAINT "Certificate_code_key" UNIQUE ("code"),
  CONSTRAINT "Certificate_storageKey_key" UNIQUE ("storageKey"),
  CONSTRAINT "Certificate_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Certificate_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Certificate_owner_scope" FOREIGN KEY ("institutionId","ownerId") REFERENCES "AppUser"("institutionId","id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Certificate_institutionId_ownerId_issuedAt_id_idx" ON "Certificate"("institutionId","ownerId","issuedAt" DESC,"id" DESC);
CREATE INDEX "Certificate_institutionId_ticketId_idx" ON "Certificate"("institutionId","ticketId");

CREATE TYPE "CertificateVerificationResult" AS ENUM ('valida','inexistente','alterado','archivo_no_verificable');

CREATE TABLE "CertificateVerification" (
  "id" UUID NOT NULL,
  "institutionId" UUID NOT NULL,
  "certificateId" UUID,
  "code" VARCHAR(64) NOT NULL,
  "result" "CertificateVerificationResult" NOT NULL,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CertificateVerification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CertificateVerification_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CertificateVerification_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "CertificateVerification_institutionId_occurredAt_idx" ON "CertificateVerification"("institutionId","occurredAt" DESC);
CREATE INDEX "CertificateVerification_code_occurredAt_idx" ON "CertificateVerification"("code","occurredAt" DESC);

DO $block$
DECLARE item text;
BEGIN
 FOREACH item IN ARRAY ARRAY['Certificate','CertificateVerification'] LOOP
  EXECUTE format('REVOKE ALL ON %I FROM PUBLIC', item);
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
   EXECUTE format('REVOKE ALL ON %I FROM anon, authenticated', item);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='campusitsm_api') THEN
   EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', item);
   EXECUTE format('CREATE POLICY campusitsm_server ON %I FOR ALL TO campusitsm_api USING (true) WITH CHECK (true)', item);
   EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON %I TO campusitsm_api', item);
  END IF;
 END LOOP;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='campusitsm_api') THEN
  REVOKE UPDATE,DELETE ON "CertificateVerification" FROM campusitsm_api;
 END IF;
END $block$;
