// Único contrato de conexión para API, migración y traslado de esta instalación.
function validateConnection(value, purpose) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Configura la conexión PostgreSQL privada antes de continuar.'); }
  if (url.protocol !== 'postgresql:') throw new Error('Se requiere PostgreSQL.');
  if (url.hostname === 'db') return { local: true };
  const role = purpose === 'migrate' ? 'campusitsm_migrator' : 'campusitsm_api';
  if (url.hostname !== 'aws-1-sa-east-1.pooler.supabase.com' || url.port !== '5432' ||
      decodeURIComponent(url.username) !== `${role}.npjibnlxepiwfermtcmo` || url.pathname !== '/postgres' ||
      url.searchParams.get('schema') !== 'campusitsm' || url.searchParams.get('sslmode') !== 'require' ||
      url.searchParams.get('sslaccept') !== 'strict' || url.searchParams.get('sslcert') !== 'certs/supabase-ca.crt') {
    throw new Error('Conexión no admitida: revisa proyecto, rol de API/migración, esquema, puerto y TLS.');
  }
  return { local: false };
}
module.exports = { validateConnection };
