-- El actor automático no suplanta al titular. Conserva la FK para actores humanos.
ALTER TABLE "TicketChange" ALTER COLUMN "actorId" DROP NOT NULL;
-- El enum se amplió en la migración anterior y ya está confirmado antes de usarlo.
INSERT INTO "CertificateVerification" ("id","institutionId","certificateId","actorId","code","result","occurredAt")
SELECT gen_random_uuid(), c."institutionId", c."id", c."ownerId", c."code", 'emitida', c."issuedAt"
FROM "Certificate" c WHERE NOT EXISTS (
  SELECT 1 FROM "CertificateVerification" v WHERE v."certificateId"=c."id" AND v."result"='emitida'
);
