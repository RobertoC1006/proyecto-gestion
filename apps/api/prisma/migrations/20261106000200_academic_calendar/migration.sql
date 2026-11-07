-- CreateEnum
CREATE TYPE "AcademicEventType" AS ENUM ('examen', 'entrega', 'matricula');

-- CreateEnum
CREATE TYPE "AcademicScope" AS ENUM ('institution', 'course', 'section');

-- CreateTable
CREATE TABLE "AcademicCourse" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicSection" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicMembership" (
    "institutionId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicMembership_pkey" PRIMARY KEY ("sectionId","subjectId")
);

-- CreateTable
CREATE TABLE "AcademicEvent" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "type" "AcademicEventType" NOT NULL,
    "scope" "AcademicScope" NOT NULL,
    "courseId" UUID,
    "sectionId" UUID,
    "source" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AcademicEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicChange" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "entityType" VARCHAR(40) NOT NULL,
    "entityId" UUID NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "source" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicCourse_institutionId_code_key" ON "AcademicCourse"("institutionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicCourse_institutionId_id_key" ON "AcademicCourse"("institutionId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSection_courseId_code_key" ON "AcademicSection"("courseId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSection_institutionId_courseId_id_key" ON "AcademicSection"("institutionId", "courseId", "id");

-- CreateIndex
CREATE INDEX "AcademicMembership_institutionId_subjectId_idx" ON "AcademicMembership"("institutionId", "subjectId");

-- CreateIndex
CREATE INDEX "AcademicEvent_institutionId_startsAt_endsAt_idx" ON "AcademicEvent"("institutionId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "AcademicChange_institutionId_createdAt_idx" ON "AcademicChange"("institutionId", "createdAt");

-- AddForeignKey
ALTER TABLE "AcademicCourse" ADD CONSTRAINT "AcademicCourse_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicSection" ADD CONSTRAINT "AcademicSection_institutionId_courseId_fkey" FOREIGN KEY ("institutionId", "courseId") REFERENCES "AcademicCourse"("institutionId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicMembership" ADD CONSTRAINT "AcademicMembership_institutionId_courseId_sectionId_fkey" FOREIGN KEY ("institutionId", "courseId", "sectionId") REFERENCES "AcademicSection"("institutionId", "courseId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicEvent" ADD CONSTRAINT "AcademicEvent_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicEvent" ADD CONSTRAINT "AcademicEvent_institutionId_courseId_fkey" FOREIGN KEY ("institutionId", "courseId") REFERENCES "AcademicCourse"("institutionId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicEvent" ADD CONSTRAINT "AcademicEvent_institutionId_courseId_sectionId_fkey" FOREIGN KEY ("institutionId", "courseId", "sectionId") REFERENCES "AcademicSection"("institutionId", "courseId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Restricciones de dominio adicionales a las claves foráneas de Prisma.
ALTER TABLE "AcademicCourse" ADD CONSTRAINT "AcademicCourse_not_blank" CHECK (length(trim("code")) > 0 AND length(trim("name")) > 0);
ALTER TABLE "AcademicSection" ADD CONSTRAINT "AcademicSection_not_blank" CHECK (length(trim("code")) > 0 AND length(trim("name")) > 0);
ALTER TABLE "AcademicEvent" ADD CONSTRAINT "AcademicEvent_valid_period" CHECK ("endsAt" > "startsAt");
ALTER TABLE "AcademicEvent" ADD CONSTRAINT "AcademicEvent_valid_scope" CHECK (
  ("scope" = 'institution' AND "courseId" IS NULL AND "sectionId" IS NULL) OR
  ("scope" = 'course' AND "courseId" IS NOT NULL AND "sectionId" IS NULL) OR
  ("scope" = 'section' AND "courseId" IS NOT NULL AND "sectionId" IS NOT NULL)
);
ALTER TABLE "AcademicEvent" ADD CONSTRAINT "AcademicEvent_manual_source" CHECK ("source" = 'manual');
ALTER TABLE "AcademicEvent" ADD CONSTRAINT "AcademicEvent_valid_title_version" CHECK (length(trim("title")) > 0 AND "version" > 0);
ALTER TABLE "AcademicChange" ADD CONSTRAINT "AcademicChange_reason" CHECK (length(trim("reason")) >= 5);
