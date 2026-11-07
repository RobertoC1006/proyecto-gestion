CREATE TYPE "CampusRole" AS ENUM ('estudiante', 'docente', 'ti_agente', 'ti_supervisor', 'administrador');
ALTER TABLE "SupportTeam" ADD CONSTRAINT "SupportTeam_institutionId_id_key" UNIQUE ("institutionId", "id");
CREATE TABLE "AppUser" (
  "id" UUID PRIMARY KEY, "institutionId" UUID NOT NULL,
  "email" VARCHAR(254) NOT NULL, "displayName" VARCHAR(120) NOT NULL,
  "role" "CampusRole" NOT NULL DEFAULT 'estudiante', "active" BOOLEAN NOT NULL DEFAULT true,
  "teamId" UUID, "accessVersion" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "AppUser_institutionId_id_key" UNIQUE ("institutionId", "id"),
  CONSTRAINT "AppUser_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AppUser_team_fkey" FOREIGN KEY ("institutionId", "teamId") REFERENCES "SupportTeam"("institutionId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AppUser_name_check" CHECK (length(trim("displayName")) > 0),
  CONSTRAINT "AppUser_version_check" CHECK ("accessVersion" > 0)
);
CREATE INDEX "AppUser_institutionId_role_active_idx" ON "AppUser"("institutionId", "role", "active");
CREATE TABLE "AuthSession" (
  "id" VARCHAR(64) PRIMARY KEY, "userId" UUID NOT NULL, "accessVersion" INTEGER NOT NULL,
  "tokens" TEXT NOT NULL, "tokenExpiresAt" TIMESTAMPTZ(3) NOT NULL, "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");
CREATE TABLE "AuthThrottle" ("id" VARCHAR(64) PRIMARY KEY, "attempts" INTEGER NOT NULL DEFAULT 1, "expiresAt" TIMESTAMPTZ(3) NOT NULL);
CREATE TABLE "IdentityChange" (
  "id" UUID PRIMARY KEY, "institutionId" UUID NOT NULL, "actorId" UUID NOT NULL, "subjectId" UUID NOT NULL,
  "reason" VARCHAR(500) NOT NULL, "before" JSONB NOT NULL, "after" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "IdentityChange_institutionId_createdAt_idx" ON "IdentityChange"("institutionId", "createdAt");
