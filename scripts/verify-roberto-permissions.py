"""Production-like roles/RLS and pg-boss install; isolated PostgreSQL, no network."""
import subprocess
import time
import uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def main():
    name='campusitsm-roberto-permissions-'+uuid.uuid4().hex[:12]
    def command(*args,input=None):
        r=subprocess.run(args,cwd=ROOT,input=input,capture_output=True,text=True,encoding='utf-8')
        if r.returncode:raise RuntimeError(r.stderr)
        return r.stdout
    def sql(s):return command('docker','exec','-i',name,'psql','-X','-U','postgres','-v','ON_ERROR_STOP=1','-At',input=s)
    try:
        command('docker','run','-d','--name',name,'--network','none','--tmpfs','/var/lib/postgresql/data','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17-alpine')
        for _ in range(30):
            try:command('docker','exec',name,'pg_isready','-U','postgres');break
            except RuntimeError:time.sleep(1)
        sql('''CREATE ROLE campusitsm_migrator NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE ROLE campusitsm_api NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE ROLE anon; CREATE ROLE authenticated;
CREATE SCHEMA campusitsm AUTHORIZATION campusitsm_migrator;
GRANT USAGE ON SCHEMA campusitsm TO campusitsm_api;
ALTER DEFAULT PRIVILEGES FOR ROLE campusitsm_migrator IN SCHEMA campusitsm GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO campusitsm_api;''')
        prefix='SET ROLE campusitsm_migrator; SET search_path=campusitsm,public;\n'
        for p in sorted((ROOT/'apps/api/prisma/migrations').glob('*/migration.sql')):sql(prefix+p.read_text(encoding='utf-8'))
        for table in ['DemandConfig','ForecastRun','DemandAlert','Notification','NotificationEvent','queue','job','job_common','schedule']:
            assert sql(f"SELECT has_table_privilege('anon','campusitsm.\"{table}\"','SELECT') OR has_table_privilege('authenticated','campusitsm.\"{table}\"','SELECT');").strip()=='f',table
            assert sql(f"SELECT rowsecurity FROM pg_tables WHERE schemaname='campusitsm' AND tablename='{table}';").strip()=='t',table
        assert sql("SELECT has_schema_privilege('campusitsm_api','campusitsm','CREATE');").strip()=='f'
        sql('''SET ROLE campusitsm_api; SET search_path=campusitsm,public;
SELECT campusitsm.create_queue('__pgboss__send-it','{"policy":"standard"}'::jsonb);
SELECT count(*) FROM "ForecastRun";SELECT count(*) FROM "Notification";
SELECT count(*) FROM campusitsm.job_common;''')
        print('OK: 18 migraciones con rol migrador limitado; nueve tablas protegidas; anon/authenticated sin lectura; API sin DDL; cola interna existente reutilizable.')
    finally:subprocess.run(['docker','rm','-f',name],cwd=ROOT,capture_output=True)
if __name__=='__main__':main()
