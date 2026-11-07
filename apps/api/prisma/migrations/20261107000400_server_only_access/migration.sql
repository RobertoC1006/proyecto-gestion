-- La API NestJS autoriza institución, rol y objeto. El navegador no accede a estas tablas.
-- En pruebas locales el usuario dueño conserva su funcionamiento habitual.
DO $block$
DECLARE item record;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'campusitsm_api') THEN
    FOR item IN SELECT tablename FROM pg_tables
      WHERE schemaname = current_schema() AND tablename <> '_prisma_migrations'
    LOOP
      EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', current_schema(), item.tablename);
      EXECUTE format('CREATE POLICY campusitsm_server ON %I.%I FOR ALL TO campusitsm_api USING (true) WITH CHECK (true)', current_schema(), item.tablename);
    END LOOP;
  END IF;
END $block$;
