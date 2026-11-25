-- Consentimientos explícitos, versionados e idempotentes.
CREATE TABLE "ConsentVersion" (
  "id" UUID NOT NULL,
  "version" VARCHAR(40) NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "summary" VARCHAR(1000) NOT NULL,
  "effectiveAt" TIMESTAMPTZ(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsentVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConsentVersion_version_key" UNIQUE ("version")
);
CREATE INDEX "ConsentVersion_active_effectiveAt_idx" ON "ConsentVersion"("active", "effectiveAt");

CREATE TABLE "ConsentAcceptance" (
  "id" UUID NOT NULL,
  "institutionId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "consentVersionId" UUID NOT NULL,
  "acceptedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsentAcceptance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConsentAcceptance_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ConsentAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ConsentAcceptance_consentVersionId_fkey" FOREIGN KEY ("consentVersionId") REFERENCES "ConsentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ConsentAcceptance_userId_consentVersionId_key" UNIQUE ("userId", "consentVersionId")
);
CREATE INDEX "ConsentAcceptance_institutionId_acceptedAt_idx" ON "ConsentAcceptance"("institutionId", "acceptedAt");
CREATE INDEX "ConsentAcceptance_institutionId_userId_acceptedAt_idx" ON "ConsentAcceptance"("institutionId", "userId", "acceptedAt");

DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'campusitsm_api') THEN
    ALTER TABLE "ConsentVersion" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "ConsentAcceptance" ENABLE ROW LEVEL SECURITY;
    CREATE POLICY campusitsm_server ON "ConsentVersion" FOR ALL TO campusitsm_api USING (true) WITH CHECK (true);
    CREATE POLICY campusitsm_server ON "ConsentAcceptance" FOR ALL TO campusitsm_api USING (true) WITH CHECK (true);
    REVOKE UPDATE, DELETE ON "ConsentAcceptance" FROM campusitsm_api;
  END IF;
END $block$;
