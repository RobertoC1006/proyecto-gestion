"""Comprueba actualización desde las doce migraciones publicadas, solo en PostgreSQL tmpfs."""
import hashlib
import subprocess
import time
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '001864a496bdbfd22eff52074942d49aad22c54e'

def main():
    container = 'campusitsm-upgrade-check-' + uuid.uuid4().hex[:12]
    def command(*args, **kwargs):
        result = subprocess.run(args, cwd=ROOT, capture_output=True, text=True, encoding='utf-8', **kwargs)
        if result.returncode:
            raise RuntimeError(result.stderr)
        return result.stdout
    def sql(query):
        return command('docker', 'exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'upgrade_test', '-At', input=query)
    paths = command('git','ls-tree','-r','--name-only',BASE,'--','apps/api/prisma/migrations').splitlines()
    old = sorted(path for path in paths if path.endswith('/migration.sql'))
    assert len(old) == 12
    try:
        command('docker','run','-d','--name',container,'--network','none','--tmpfs','/var/lib/postgresql/data',
                '-e','POSTGRES_HOST_AUTH_METHOD=trust','-e','POSTGRES_DB=upgrade_test','postgres:17-alpine')
        for _ in range(40):
            try:
                command('docker','exec',container,'pg_isready','-U','postgres','-d','upgrade_test')
                break
            except RuntimeError:
                time.sleep(1)
        sql('CREATE ROLE campusitsm_api; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO campusitsm_api;')
        for path in old:
            original = subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
            assert hashlib.sha256(original).digest() == hashlib.sha256((ROOT/path).read_bytes()).digest(), path
            sql(original.decode())
        institution, owner, ticket, certificate = [str(uuid.uuid4()) for _ in range(4)]
        code, digest = 'CITS-'+'A'*20, 'a'*64
        sql(f'''INSERT INTO "Institution" (id,code,name) VALUES ('{institution}','UPGRADE-TEST','Fixture aislado');
        INSERT INTO "AppUser" (id,"institutionId",email,"displayName",role,"updatedAt") VALUES ('{owner}','{institution}','upgrade@example.test','Titular ficticio','estudiante',CURRENT_TIMESTAMP);
        INSERT INTO "Ticket" (id,"institutionId","ownerId",code,description,service,scope,"idempotencyKey","requestHash",status,"resolvedAt","failureConfirmed","updatedAt","isDemo")
        VALUES ('{ticket}','{institution}','{owner}','INC-UPGRADE','DEMO aislado de actualización de constancias','correo','general','{uuid.uuid4()}','{'b'*64}','resuelto','2026-11-24T10:00:00Z',true,CURRENT_TIMESTAMP,true);
        INSERT INTO "Certificate" (id,"institutionId","ticketId","ownerId",code,"ticketCode",service,"resolvedAt",sha256,"storageKey")
        VALUES ('{certificate}','{institution}','{ticket}','{owner}','{code}','INC-UPGRADE','correo','2026-11-24T10:00:00Z','{digest}','certificates/{institution}/{ticket}.pdf');''')
        before = sql(f'''SELECT row_to_json(c)::text FROM "Certificate" c WHERE id='{certificate}';''')
        all_paths = sorted((ROOT/'apps/api/prisma/migrations').glob('*/migration.sql'))
        sql('CREATE SCHEMA campusitsm;')
        pending = [path for path in all_paths if path.relative_to(ROOT).as_posix() not in old]
        assert len(pending) == 6
        for path in pending:
            sql(path.read_text(encoding='utf-8'))
        assert sql(f'''SELECT row_to_json(c)::text FROM "Certificate" c WHERE id='{certificate}';''') == before
        assert sql(f'''SELECT "reportedService" FROM "Ticket" WHERE id='{ticket}';''').strip() == 'correo'
        assert sql(f'''SELECT count(*) FROM "CertificateVerification" WHERE "certificateId"='{certificate}' AND result='emitida' AND "actorId"='{owner}';''').strip() == '1'
        assert sql('''SELECT has_table_privilege('campusitsm_api','"Certificate"','UPDATE') OR has_table_privilege('campusitsm_api','"Certificate"','DELETE');''').strip() == 'f'
        assert sql('''SELECT is_nullable FROM information_schema.columns WHERE table_name='TicketChange' AND column_name='actorId';''').strip() == 'YES'
        print('OK: doce SQL originales intactos; seis migraciones aditivas; constancia original idéntica; evento histórico recuperado; privilegios inmutables y actor automático comprobados.')
    finally:
        subprocess.run(['docker','rm','-f',container],cwd=ROOT,check=False,capture_output=True)

if __name__ == '__main__':
    main()
