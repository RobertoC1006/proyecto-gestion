-- Extiende la migración ya aplicada sin cambiar su archivo ni eliminar estados históricos.
ALTER TYPE "CertificateVerificationResult" ADD VALUE IF NOT EXISTS 'emitida';
ALTER TYPE "CertificateVerificationResult" ADD VALUE IF NOT EXISTS 'descargada';
ALTER TYPE "CertificateVerificationResult" ADD VALUE IF NOT EXISTS 'consultada';
ALTER TABLE "CertificateVerification" ADD COLUMN "actorId" UUID,
  ADD CONSTRAINT "CertificateVerification_actor_scope" FOREIGN KEY ("institutionId","actorId")
  REFERENCES "AppUser"("institutionId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "CertificateVerification_institutionId_actorId_occurredAt_idx"
  ON "CertificateVerification"("institutionId","actorId","occurredAt" DESC);
ALTER TABLE "Certificate"
  ADD CONSTRAINT "Certificate_sha256_valid" CHECK ("sha256" ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT "Certificate_code_valid" CHECK ("code" ~ '^CITS-[A-Z0-9]{20}$');
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='campusitsm_api') THEN
    REVOKE UPDATE,DELETE ON "Certificate", "CertificateVerification" FROM campusitsm_api;
  END IF;
END $block$;
