-- Ampliación del catálogo común autorizada para profesor y administrador/TI.
-- Conserva las configuraciones y las capacidades históricas del equipo.
ALTER TABLE "RoleAccess" DROP CONSTRAINT "RoleAccess_known_permissions";
ALTER TABLE "RoleAccess" ADD CONSTRAINT "RoleAccess_known_permissions" CHECK (
 "permissions" <@ ARRAY[
 'academic:read:self','academic:manage','academic:teach',
 'tickets:read:self','tickets:create','tickets:read:team','tickets:work:team','tickets:assign:team',
 'tickets:read:institution','tickets:work:institution',
 'certificates:request:self','reports:read:team','reports:read:institution',
 'users:manage','permissions:manage','configuration:manage','audit:read:institution'
 ]::TEXT[]
);
ALTER TABLE "RoleAccess" DROP CONSTRAINT "RoleAccess_role_scope";
ALTER TABLE "RoleAccess" ADD CONSTRAINT "RoleAccess_role_scope" CHECK (
 ("role"='estudiante' AND "permissions" <@ ARRAY['academic:read:self','tickets:create','tickets:read:self','certificates:request:self']::TEXT[]) OR
 ("role"='docente' AND "permissions" <@ ARRAY['academic:read:self','academic:teach','tickets:create','tickets:read:self','certificates:request:self']::TEXT[]) OR
 ("role"='ti_agente' AND "permissions" <@ ARRAY['academic:read:self','tickets:read:team','tickets:work:team']::TEXT[]) OR
 ("role"='ti_supervisor' AND "permissions" <@ ARRAY['academic:read:self','tickets:read:team','tickets:work:team','tickets:assign:team','reports:read:team']::TEXT[]) OR
 ("role"='administrador' AND ARRAY['users:manage','permissions:manage']::TEXT[] <@ "permissions")
);
