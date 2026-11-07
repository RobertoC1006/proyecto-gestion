-- Aditiva: conserva las sesiones antiguas para el respaldo/traslado.
-- El traslado asigna las sesiones existentes a la instalación que posee su clave.
ALTER TABLE "AuthSession" ADD COLUMN "instanceId" VARCHAR(64) NOT NULL DEFAULT 'legacy';
ALTER TABLE "AuthFlow" ADD COLUMN "instanceId" VARCHAR(64) NOT NULL DEFAULT 'legacy';
CREATE INDEX "AuthSession_instanceId_expiresAt_idx" ON "AuthSession"("instanceId", "expiresAt");
CREATE INDEX "AuthFlow_instanceId_expiresAt_idx" ON "AuthFlow"("instanceId", "expiresAt");
