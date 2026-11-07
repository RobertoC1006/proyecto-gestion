const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateConnection } = require('../prisma/connection.cjs');
test('Conexiones: API/migración separadas y rechazo de proyecto, esquema o TLS incorrectos', () => {
  const target = 'postgresql://campusitsm_api.npjibnlxepiwfermtcmo:fake@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?schema=campusitsm&sslmode=require&sslaccept=strict&sslcert=certs/supabase-ca.crt';
  assert.equal(validateConnection(target, 'api').local, false);
  const migrator = target.replace('campusitsm_api.', 'campusitsm_migrator.');
  assert.equal(validateConnection(migrator, 'migrate').local, false);
  assert.throws(() => validateConnection(migrator, 'api'));
  assert.throws(() => validateConnection(target, 'migrate'));
  for (const value of [target.replace('npjibnlxepiwfermtcmo', 'anotherproject'), target.replace(':5432/', ':6543/'),
    target.replace('schema=campusitsm', 'schema=public'), target.replace('sslmode=require', 'sslmode=disable'),
    target.replace('sslaccept=strict', 'sslaccept=accept_invalid_certs'), target.replace('sslcert=certs/supabase-ca.crt', 'sslcert=unknown.crt'), '']) {
    assert.throws(() => validateConnection(value, 'api'));
  }
  assert.equal(validateConnection('postgresql://test:test@db:5432/test?schema=public', 'api').local, true);
});
