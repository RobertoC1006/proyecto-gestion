CREATE TABLE "DemandAlert" (
 "id" uuid PRIMARY KEY,"institutionId" uuid NOT NULL REFERENCES "Institution"("id") ON DELETE RESTRICT,
 "source" varchar(20) NOT NULL CHECK ("source" IN ('synthetic','operational')),
 "weekStart" date NOT NULL,"runId" uuid NOT NULL REFERENCES "ForecastRun"("id") ON DELETE RESTRICT,
 "expected" double precision NOT NULL CHECK ("expected">=0 AND "expected"<'Infinity'::float8),
 "capacity" integer NOT NULL CHECK ("capacity">0),"active" boolean NOT NULL DEFAULT true,
 "reviewedAt" timestamptz(3),"reviewedById" uuid,"reviewReason" varchar(500),"updatedAt" timestamptz(3) NOT NULL,
 CONSTRAINT "DemandAlert_reviewer_scope" FOREIGN KEY ("institutionId","reviewedById") REFERENCES "AppUser"("institutionId","id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "DemandAlert_institutionId_source_weekStart_key" ON "DemandAlert"("institutionId","source","weekStart");
CREATE TABLE "Notification" (
 "id" uuid PRIMARY KEY,"institutionId" uuid NOT NULL,"recipientId" uuid NOT NULL,
 "eventKey" varchar(180) NOT NULL,"type" varchar(32) NOT NULL,"title" varchar(160) NOT NULL,
 "body" varchar(500) NOT NULL,"href" varchar(200) NOT NULL CHECK ("href" ~ '^/[^/]'),
 "isDemo" boolean NOT NULL DEFAULT false,"readAt" timestamptz(3),"createdAt" timestamptz(3) NOT NULL DEFAULT now(),
 CONSTRAINT "Notification_recipient_scope" FOREIGN KEY ("institutionId","recipientId") REFERENCES "AppUser"("institutionId","id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "Notification_recipientId_eventKey_key" ON "Notification"("recipientId","eventKey");
CREATE INDEX "Notification_institutionId_recipientId_createdAt_idx" ON "Notification"("institutionId","recipientId","createdAt" DESC);
CREATE TABLE "NotificationEvent" (
 "id" varchar(180) PRIMARY KEY,"institutionId" uuid NOT NULL,"recipientId" uuid NOT NULL,
 "type" varchar(32) NOT NULL,"title" varchar(160) NOT NULL,"body" varchar(500) NOT NULL,
 "href" varchar(200) NOT NULL CHECK ("href" ~ '^/[^/]'),"isDemo" boolean NOT NULL DEFAULT false,
 "createdAt" timestamptz(3) NOT NULL DEFAULT now(),"processedAt" timestamptz(3),
 CONSTRAINT "NotificationEvent_recipient_scope" FOREIGN KEY ("institutionId","recipientId") REFERENCES "AppUser"("institutionId","id") ON DELETE RESTRICT
);
CREATE INDEX "NotificationEvent_processedAt_createdAt_idx" ON "NotificationEvent"("processedAt","createdAt");
DO $permissions$
DECLARE item text;
BEGIN
 FOREACH item IN ARRAY ARRAY['DemandAlert','Notification','NotificationEvent'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',item);
  EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',item);
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN EXECUTE format('REVOKE ALL ON %I FROM anon,authenticated',item); END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='campusitsm_api') THEN
   EXECUTE format('CREATE POLICY campusitsm_server ON %I FOR ALL TO campusitsm_api USING (true) WITH CHECK (true)',item);
   EXECUTE format('GRANT SELECT,INSERT,UPDATE ON %I TO campusitsm_api',item);
   EXECUTE format('REVOKE DELETE ON %I FROM campusitsm_api',item);
  END IF;
 END LOOP;
END $permissions$;
