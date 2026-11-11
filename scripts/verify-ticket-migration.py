"""Revisa el SQL exacto de una referencia Git en PostgreSQL descartable, sin red.

No lee .env, no acepta DATABASE_URL, no migra Supabase ni modifica la rama fuente.
"""
import argparse
import hashlib
from pathlib import Path
import re
import secrets
import subprocess
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = 'apps/api/prisma/migrations/20261108000100_tickets_core/migration.sql'


def run(*args, input=None, check=True):
    result = subprocess.run(args, cwd=ROOT, input=input, text=True, encoding='utf-8',
                            capture_output=True)
    if check and result.returncode:
        raise RuntimeError(result.stderr or result.stdout)
    return result


def git_text(ref, path):
    return run('git', 'show', f'{ref}:{path}').stdout


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ref', default='origin/gestion-incidencias')
    args = parser.parse_args()
    ref = run('git', 'rev-parse', '--verify', f'{args.ref}^{{commit}}').stdout.strip()
    paths = run('git', 'ls-tree', '-r', '--name-only', ref,
                'apps/api/prisma/migrations').stdout.splitlines()
    migrations = sorted(p for p in paths if p.endswith('/migration.sql'))
    if not migrations or migrations[-1] != MIGRATION:
        raise RuntimeError('Revisar el conjunto de migraciones antes de usar este verificador de Corte 3.')
    source = git_text(ref, MIGRATION)
    image = re.search(r'image: (postgres:17-alpine@sha256:[0-9a-f]{64})',
                      (ROOT / 'compose.yml').read_text(encoding='utf-8')).group(1)
    container = 'campusitsm-ticket-migration-check-' + uuid.uuid4().hex
    count = 0

    def sql(body, check=True):
        return run('docker', 'exec', '-i', container, 'psql', '-X', '-U', 'postgres',
                   '-d', 'review', '-qAt', '-v', 'ON_ERROR_STOP=1',
                   input='\\set VERBOSITY sqlstate\n' + body, check=check)

    def test(label, body, error=None):
        nonlocal count
        result = sql('BEGIN; SET LOCAL search_path = campusitsm, public;\n' + body + '\nROLLBACK;', check=False)
        if error:
            if result.returncode == 0 or f'ERROR:  {error}' not in result.stderr:
                raise AssertionError(f'{label}: se esperaba SQLSTATE {error}: {result.stderr}')
        elif result.returncode:
            raise AssertionError(f'{label}: {result.stderr}')
        count += 1
        print(f'OK {count}: {label}', flush=True)

    def assert_sql(condition):
        return f"DO $$ BEGIN IF NOT ({condition}) THEN RAISE EXCEPTION 'verificación fallida'; END IF; END $$;"

    institution = '10000000-0000-4000-8000-000000000001'
    other = '10000000-0000-4000-8000-000000000002'
    owner = '20000000-0000-4000-8000-000000000001'
    stranger = '20000000-0000-4000-8000-000000000002'
    course = '30000000-0000-4000-8000-000000000001'
    foreign_course = '30000000-0000-4000-8000-000000000002'
    second_course = '30000000-0000-4000-8000-000000000003'
    section = '40000000-0000-4000-8000-000000000001'
    second_section = '40000000-0000-4000-8000-000000000002'
    ticket_id = '50000000-0000-4000-8000-000000000001'

    def literal(value):
        return 'NULL' if value is None else "'" + str(value).replace("'", "''") + "'"

    def ticket(**overrides):
        row = dict(id=str(uuid.uuid4()), institutionId=institution, ownerId=owner,
                   code='INC-2026-' + secrets.token_hex(12).upper(),
                   description='No puedo acceder al correo institucional.', service='correo',
                   scope='general', courseId=None, sectionId=None, idempotencyKey=str(uuid.uuid4()),
                   requestHash='a' * 64, updatedAt='2026-11-11T12:00:00Z')
        row.update(overrides)
        columns = ','.join('"' + key + '"' for key in row)
        return f'INSERT INTO "Ticket" ({columns}) VALUES ({",".join(map(literal, row.values()))});'

    def attachment(**overrides):
        row = dict(id=str(uuid.uuid4()), ticketId=ticket_id, storageKey=uuid.uuid4().hex,
                   originalName='captura.png', mimeType='image/png', sizeBytes=1024, sha256='b' * 64)
        row.update(overrides)
        columns = ','.join('"' + key + '"' for key in row)
        return f'INSERT INTO "TicketAttachment" ({columns}) VALUES ({",".join(map(literal, row.values()))});'

    print(f'Referencia: {ref}\nMigración: {MIGRATION}\nSHA256 SQL UTF-8/LF: {hashlib.sha256(source.encode()).hexdigest()}', flush=True)
    started = False
    try:
        run('docker', 'run', '--rm', '-d', '--name', container, '--network', 'none',
            '--tmpfs', '/var/lib/postgresql/data', '-e', 'POSTGRES_DB=review',
            '-e', 'POSTGRES_PASSWORD=' + secrets.token_urlsafe(32), image)
        started = True
        for _ in range(60):
            if run('docker', 'exec', container, 'pg_isready', '-U', 'postgres', '-d', 'review', check=False).returncode == 0:
                break
            time.sleep(0.5)
        else:
            raise RuntimeError('PostgreSQL descartable no inició.')
        sql('''CREATE ROLE campusitsm_migrator NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE ROLE campusitsm_api NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA campusitsm AUTHORIZATION campusitsm_migrator;
REVOKE ALL ON SCHEMA campusitsm FROM PUBLIC;
GRANT USAGE ON SCHEMA campusitsm TO campusitsm_api;
ALTER DEFAULT PRIVILEGES FOR ROLE campusitsm_migrator IN SCHEMA campusitsm
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO campusitsm_api;''')
        prefix = 'SET ROLE campusitsm_migrator; SET search_path = campusitsm, public;\n'
        for path in migrations[:-1]:
            sql(prefix + git_text(ref, path))
        # Defaults deliberadamente abiertos: la migración debe retirar estos permisos.
        sql('''ALTER DEFAULT PRIVILEGES FOR ROLE campusitsm_migrator IN SCHEMA campusitsm
GRANT ALL ON TABLES TO PUBLIC, anon, authenticated;''')
        sql(prefix + source)
        test('las dos tablas pertenecen al migrador y tienen RLS/política de servidor', assert_sql('''
          (SELECT count(*) = 2 FROM pg_tables WHERE schemaname = 'campusitsm'
           AND tablename IN ('Ticket','TicketAttachment') AND tableowner = 'campusitsm_migrator' AND rowsecurity)
          AND (SELECT count(*) = 2 FROM pg_policies WHERE schemaname = 'campusitsm'
           AND tablename IN ('Ticket','TicketAttachment') AND policyname = 'campusitsm_server'
           AND roles = ARRAY['campusitsm_api']::name[] AND cmd = 'ALL' AND qual = 'true' AND with_check = 'true')'''))
        test('API tiene CRUD sin DDL/TRUNCATE/REFERENCES/TRIGGER ni BYPASSRLS', assert_sql('''
          (SELECT bool_and(has_table_privilege('campusitsm_api', format('campusitsm.%I', t), p))
           FROM unnest(ARRAY['Ticket','TicketAttachment']) t CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE']) p)
          AND NOT has_schema_privilege('campusitsm_api','campusitsm','CREATE')
          AND NOT (SELECT rolbypassrls OR rolsuper FROM pg_roles WHERE rolname='campusitsm_api')
          AND (SELECT bool_and(NOT has_table_privilege('campusitsm_api', format('campusitsm.%I',t),p))
           FROM unnest(ARRAY['Ticket','TicketAttachment']) t CROSS JOIN unnest(ARRAY['TRUNCATE','REFERENCES','TRIGGER']) p)'''))
        test('anon/authenticated sin privilegios aunque los defaults los concedían', assert_sql('''
          (SELECT bool_and(NOT has_table_privilege(r,format('campusitsm.%I',t),p))
           FROM unnest(ARRAY['anon','authenticated']) r CROSS JOIN unnest(ARRAY['Ticket','TicketAttachment']) t
           CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p)'''))
        # Con USAGE, una denegación no puede atribuirse solo al esquema privado.
        sql('GRANT USAGE ON SCHEMA campusitsm TO anon, authenticated;')
        for role in ['anon', 'authenticated']:
            for table in ['Ticket', 'TicketAttachment']:
                test(f'{role} no puede leer {table} aun con USAGE', f'SET LOCAL ROLE {role}; SELECT * FROM "{table}";', '42501')
        sql(f'''SET search_path=campusitsm, public;
INSERT INTO "Institution" (id,code,name) VALUES ('{institution}','REV-A','Revisión A'),('{other}','REV-B','Revisión B');
INSERT INTO "AppUser" (id,"institutionId",email,"displayName","updatedAt") VALUES
('{owner}','{institution}','owner@example.test','Titular',now()),('{stranger}','{other}','other@example.test','Otro',now());
INSERT INTO "AcademicCourse" (id,"institutionId",code,name) VALUES
('{course}','{institution}','C1','Curso 1'),('{foreign_course}','{other}','C2','Otro'),('{second_course}','{institution}','C3','Curso 3');
INSERT INTO "AcademicSection" (id,"institutionId","courseId",code,name) VALUES
('{section}','{institution}','{course}','A','A'),('{second_section}','{institution}','{second_course}','A','A');
''' + ticket(id=ticket_id))
        test('API puede crear/leer/actualizar/borrar un ticket descartable',
             'SET LOCAL ROLE campusitsm_api; ' + ticket(code='REVIEW-CRUD') +
             assert_sql('(SELECT count(*) = 1 FROM "Ticket" WHERE code=\'REVIEW-CRUD\')') +
             'UPDATE "Ticket" SET description=\'Descripción de prueba actualizada.\' WHERE code=\'REVIEW-CRUD\'; DELETE FROM "Ticket" WHERE code=\'REVIEW-CRUD\';')
        test('curso admite sección opcional', ticket(scope='curso', courseId=course))
        test('curso y sección compatibles se aceptan', ticket(scope='curso', courseId=course, sectionId=section))
        for label, values, state in [
            ('general rechaza curso', dict(courseId=course), '23514'),
            ('general rechaza sección', dict(sectionId=section), '23514'),
            ('curso exige courseId', dict(scope='curso'), '23514'),
            ('titular de otra institución rechazado', dict(ownerId=stranger), '23503'),
            ('curso de otra institución rechazado', dict(scope='curso', courseId=foreign_course), '23503'),
            ('sección de otro curso rechazada', dict(scope='curso', courseId=course, sectionId=second_section), '23503'),
            ('descripción corta rechazada', dict(description='corta'), '23514'),
            ('descripción larga rechazada', dict(description='x'*5001), '23514'),
            ('requestHash inválido rechazado', dict(requestHash='x'*64), '23514'),
            ('código duplicado rechazado', dict(code='DUPLICADO'), '23505'),
        ]:
            before = ticket(code='DUPLICADO') if label.startswith('código') else ''
            test(label, before + ticket(**values), state)
        same_key = str(uuid.uuid4())
        test('clave idempotente repetida por titular rechazada', ticket(idempotencyKey=same_key) + ticket(idempotencyKey=same_key), '23505')
        test('misma clave para titulares distintos no colisiona', ticket(idempotencyKey=same_key) +
             ticket(institutionId=other, ownerId=stranger, idempotencyKey=same_key))
        for mime in ['image/png', 'image/jpeg', 'application/pdf']:
            test(f'adjunto válido {mime}', 'SET LOCAL ROLE campusitsm_api; ' + attachment(mimeType=mime))
        for label, values, state in [
            ('tamaño cero rechazado', dict(sizeBytes=0), '23514'),
            ('tamaño negativo rechazado', dict(sizeBytes=-1), '23514'),
            ('MIME no permitido rechazado', dict(mimeType='text/html'), '23514'),
            ('SHA-256 inválido rechazado', dict(sha256='z'*64), '23514'),
            ('ruta en storageKey rechazada', dict(storageKey='../captura.png'), '23514'),
            ('ticket inexistente rechazado', dict(ticketId=str(uuid.uuid4())), '23503'),
        ]:
            test(label, attachment(**values), state)
        test('un solo adjunto por ticket', attachment() + attachment(), '23505')
        second_ticket = str(uuid.uuid4())
        test('storageKey única entre tickets', ticket(id=second_ticket) + attachment(storageKey='misma_clave') +
             attachment(ticketId=second_ticket, storageKey='misma_clave'), '23505')
        test('ticket con adjunto no se elimina en cascada', attachment() + f'DELETE FROM "Ticket" WHERE id=\'{ticket_id}\';', '23503')
        # Evidencia de la brecha para el futuro flujo de archivos; NO aprobación del límite.
        test('diagnóstico: SQL actual admite tamaño superior a 5 MiB', attachment(sizeBytes=5*1024*1024+1))
        print(f'RESULTADO: {count} comprobaciones aprobadas. Sin conexión remota.', flush=True)
    finally:
        if started:
            run('docker', 'rm', '-f', container)
            print('PostgreSQL descartable retirado; sin puertos ni volúmenes persistentes.', flush=True)


if __name__ == '__main__':
    main()
