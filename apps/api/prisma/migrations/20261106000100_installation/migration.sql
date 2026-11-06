CREATE TABLE "Institution" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Institution_code_nonempty" CHECK (length(trim("code")) > 0),
    CONSTRAINT "Institution_name_nonempty" CHECK (length(trim("name")) > 0)
);
CREATE TABLE "SupportTeam" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportTeam_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SupportTeam_code_nonempty" CHECK (length(trim("code")) > 0),
    CONSTRAINT "SupportTeam_name_nonempty" CHECK (length(trim("name")) > 0)
);
CREATE UNIQUE INDEX "Institution_code_key" ON "Institution"("code");
CREATE UNIQUE INDEX "SupportTeam_institutionId_code_key" ON "SupportTeam"("institutionId", "code");
ALTER TABLE "SupportTeam" ADD CONSTRAINT "SupportTeam_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
