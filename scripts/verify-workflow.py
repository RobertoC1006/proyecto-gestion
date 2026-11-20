"""Prueba el flujo en PostgreSQL descartable, sin leer .env ni tocar Supabase."""
import secrets
import argparse
import subprocess
import time
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def run(*args, check=True):
    return subprocess.run(args, cwd=ROOT, check=check)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tests', nargs='+', default=['test/workflow.test.cjs','test/academic.test.cjs','test/auth.test.cjs','test/auth.provider.test.cjs','test/role-permissions.test.cjs','test/users.test.cjs'])
    tests = parser.parse_args().tests
    suffix = uuid.uuid4().hex[:12]
    network = 'campusitsm-workflow-check-' + suffix
    database = network + '-db'
    password = secrets.token_hex(24)
    connection = f'postgresql://campusitsm:{password}@db:5432/workflow_test?schema=public'
    run('docker', 'network', 'create', '--internal', network)
    try:
        run('docker','run','-d','--name',database,'--network',network,'--network-alias','db',
            '--tmpfs','/var/lib/postgresql/data','-e','POSTGRES_USER=campusitsm',
            '-e',f'POSTGRES_PASSWORD={password}','-e','POSTGRES_DB=workflow_test','postgres:17-alpine')
        for _ in range(40):
            if subprocess.run(['docker','exec',database,'pg_isready','-U','campusitsm','-d','workflow_test'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode == 0:
                break
            time.sleep(1)
        base = ['docker','run','--rm','--network',network,'-e',f'DATABASE_URL={connection}',
                '-e','APP_ORIGIN=http://localhost:8080','-e','SUPABASE_URL=https://test.supabase.co',
                '-e','SUPABASE_PUBLISHABLE_KEY=sb_publishable_test_only',
                '-e','AUTH_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
                '-e','AUTH_INSTITUTION_CODE=AUTH-TEST','campusitsm-workflow-test:local']
        run(*base,'node','prisma/deploy.cjs')
        result = run(*base,'node','--test','--test-concurrency=1',*tests,check=False)
        if result.returncode:
            raise SystemExit('Fallaron comprobaciones aisladas; revisar la salida de pruebas.')
    finally:
        run('docker','rm','-f',database,check=False)
        run('docker','network','rm',network,check=False)

if __name__ == '__main__':
    main()
