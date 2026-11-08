-- Corte 1 de Johan. Validar en PostgreSQL local; Roberto revisa antes de Supabase.
CREATE TYPE "TicketService" AS ENUM (
  'aula_virtual', 'wifi_red', 'correo', 'equipos', 'impresoras',
  'cuentas_accesos', 'videoconferencia', 'sistemas_institucionales',
  'almacenamiento_nube', 'software_licencias', 'otro'
);
CREATE TYPE "TicketScope" AS ENUM ('general', 'curso');
CREATE TYPE "TicketStatus" AS ENUM ('registrado');
CREATE TYPE "TicketClassificationStatus" AS ENUM ('pendiente');

CREATE TABLE "Ticket" (
  "id" UUID NOT NULL,
  "institutionId" UUID NOT NULL,
  "ownerId" UUID NOT NULL,
  "code" VARCHAR(40) NOT NULL,
  "description" TEXT NOT NULL,
  "service" "TicketService" NOT NULL,
  "scope" "TicketScope" NOT NULL,
  "courseId" UUID,
  "sectionId" UUID,
  "status" "TicketStatus" NOT NULL DEFAULT 'registrado',
  "classificationStatus" "TicketClassificationStatus" NOT NULL DEFAULT 'pendiente',
  "idempotencyKey" UUID NOT NULL,
  "requestHash" CHAR(64) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Ticket_scope_academic_fields" CHECK (
    ("scope" = 'general' AND "courseId" IS NULL AND "sectionId" IS NULL)
    OR ("scope" = 'curso' AND "courseId" IS NOT NULL)
  ),
  CONSTRAINT "Ticket_description_length" CHECK (char_length(btrim("description")) BETWEEN 20 AND 5000),
  CONSTRAINT "Ticket_request_hash_hex" CHECK ("requestHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "Ticket_owner_fkey" FOREIGN KEY ("institutionId", "ownerId") REFERENCES "AppUser"("institutionId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Ticket_course_fkey" FOREIGN KEY ("institutionId", "courseId") REFERENCES "AcademicCourse"("institutionId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Ticket_section_fkey" FOREIGN KEY ("institutionId", "courseId", "sectionId") REFERENCES "AcademicSection"("institutionId", "courseId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Ticket_code_key" ON "Ticket"("code");
CREATE UNIQUE INDEX "Ticket_institutionId_ownerId_idempotencyKey_key" ON "Ticket"("institutionId", "ownerId", "idempotencyKey");
CREATE INDEX "Ticket_institutionId_ownerId_createdAt_id_idx" ON "Ticket"("institutionId", "ownerId", "createdAt" DESC, "id" DESC);
CREATE INDEX "Ticket_institutionId_ownerId_status_createdAt_id_idx" ON "Ticket"("institutionId", "ownerId", "status", "createdAt" DESC, "id" DESC);

-- Solo metadatos. Corte 1 no implementa carga ni descarga de archivos.
CREATE TABLE "TicketAttachment" (
  "id" UUID NOT NULL,
  "ticketId" UUID NOT NULL,
  "storageKey" VARCHAR(120) NOT NULL,
  "originalName" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(40) NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "sha256" CHAR(64) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TicketAttachment_size_positive" CHECK ("sizeBytes" > 0),
  CONSTRAINT "TicketAttachment_sha256_hex" CHECK ("sha256" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "TicketAttachment_mime_allowed" CHECK ("mimeType" IN ('image/png', 'image/jpeg', 'application/pdf')),
  CONSTRAINT "TicketAttachment_storage_key_opaque" CHECK ("storageKey" ~ '^[A-Za-z0-9_-]+$'),
  CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TicketAttachment_ticketId_key" ON "TicketAttachment"("ticketId");
CREATE UNIQUE INDEX "TicketAttachment_storageKey_key" ON "TicketAttachment"("storageKey");

-- La API autoriza además por titular. Roles y privilegios efectivos se revisan
-- con Roberto antes de aplicar en Supabase. El entorno local puede no tenerlos.
DO $block$
DECLARE item text;
DECLARE browser_role text;
BEGIN
  FOREACH item IN ARRAY ARRAY['Ticket', 'TicketAttachment'] LOOP
    EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC', item);
    FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role) THEN
        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', item, browser_role);
      END IF;
    END LOOP;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'campusitsm_api') THEN
    FOREACH item IN ARRAY ARRAY['Ticket', 'TicketAttachment'] LOOP
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO campusitsm_api', item);
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', item);
      EXECUTE format('CREATE POLICY campusitsm_server ON %I FOR ALL TO campusitsm_api USING (true) WITH CHECK (true)', item);
    END LOOP;
  END IF;
END $block$;
