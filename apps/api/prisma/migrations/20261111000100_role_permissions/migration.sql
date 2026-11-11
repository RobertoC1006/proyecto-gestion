-- Cambios aditivos; los valores iniciales siguen en el catálogo canónico del servidor.
CREATE TABLE "RoleAccess" (
  "institutionId" UUID NOT NULL,
  "role" "CampusRole" NOT NULL,
  "permissions" TEXT[] NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" >= 1),
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "RoleAccess_pkey" PRIMARY KEY ("institutionId", "role"),
  CONSTRAINT "RoleAccess_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RoleAccess_known_permissions" CHECK ("permissions" <@ ARRAY[
    'academic:read:self','academic:manage','tickets:create','tickets:read:self',
    'tickets:read:team','tickets:work:team','tickets:assign:team',
    'certificates:request:self','reports:read:team','reports:read:institution',
    'users:manage','permissions:manage','configuration:manage','audit:read:institution']::TEXT[]),
  CONSTRAINT "RoleAccess_nonnull_permissions" CHECK (array_position("permissions", NULL) IS NULL),
  CONSTRAINT "RoleAccess_role_scope" CHECK (
    ("role" IN ('estudiante','docente') AND "permissions" <@ ARRAY['academic:read:self','tickets:create','tickets:read:self','certificates:request:self']::TEXT[]) OR
    ("role" = 'ti_agente' AND "permissions" <@ ARRAY['academic:read:self','tickets:read:team','tickets:work:team']::TEXT[]) OR
    ("role" = 'ti_supervisor' AND "permissions" <@ ARRAY['academic:read:self','tickets:read:team','tickets:work:team','tickets:assign:team','reports:read:team']::TEXT[]) OR
    ("role" = 'administrador' AND ARRAY['users:manage','permissions:manage']::TEXT[] <@ "permissions")
  )
);
CREATE TABLE "RolePermissionChange" (
  "id" UUID NOT NULL,
  "institutionId" UUID NOT NULL,
  "role" "CampusRole" NOT NULL,
  "actorId" UUID NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "before" JSONB NOT NULL,
  "after" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RolePermissionChange_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RolePermissionChange_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "RolePermissionChange_institutionId_createdAt_idx" ON "RolePermissionChange"("institutionId", "createdAt");

DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'campusitsm_api') THEN
    ALTER TABLE "RoleAccess" ENABLE ROW LEVEL SECURITY;
    CREATE POLICY campusitsm_server ON "RoleAccess" FOR ALL TO campusitsm_api USING (true) WITH CHECK (true);
    ALTER TABLE "RolePermissionChange" ENABLE ROW LEVEL SECURITY;
    CREATE POLICY campusitsm_server ON "RolePermissionChange" FOR ALL TO campusitsm_api USING (true) WITH CHECK (true);
    REVOKE UPDATE, DELETE ON "RolePermissionChange" FROM campusitsm_api;
  END IF;
END $block$;
