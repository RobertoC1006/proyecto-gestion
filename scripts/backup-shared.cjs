// Lectura exclusivamente del esquema CampusITSM; nunca restaura en Supabase.
const {spawnSync}=require('node:child_process');const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');process.chdir(root);process.loadEnvFile('.env');
require('../apps/api/prisma/connection.cjs').validateConnection(process.env.DATABASE_URL,'api');
const url=new URL(process.env.DATABASE_URL),stamp=new Date().toISOString().replace(/[:.]/g,'-'),folder=path.join(root,'.local/backups/shared-'+stamp);
fs.mkdirSync(folder,{recursive:true});
function run(args){const r=spawnSync('docker',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});if(r.status!==0)throw Error('No se completó el respaldo privado; revisar el acceso de lectura.');}
try{
 const connection={PGHOST:url.hostname,PGPORT:url.port,PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGDATABASE:url.pathname.slice(1),PGSSLMODE:'verify-full',PGSSLROOTCERT:'/certs/supabase-ca.crt'};
 run(['run','--rm','--network','campusitsm_auth_egress',...Object.entries(connection).flatMap(([k,v])=>['-e',`${k}=${v}`]),'-v',`${path.join(root,'apps/api/prisma/certs')}:/certs:ro`,'-v',`${folder}:/backup`,'postgres:17-alpine','pg_dump','--schema=campusitsm','--enable-row-security','--format=custom','--file=/backup/database.dump']);
 for(const name of ['files','models'])run(['run','--rm','--network','none','-v',`campusitsm_${name}_data:/source:ro`,'-v',`${folder}:/backup`,'postgres:17-alpine','tar','-czf',`/backup/${name}.tar.gz`,'-C','/source','.']);
 const hashes={};for(const name of ['database.dump','files.tar.gz','models.tar.gz'])hashes[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(folder,name))).digest('hex');
 fs.writeFileSync(path.join(folder,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),schema:'campusitsm',hashes},null,2));
 fs.writeFileSync(path.join(folder,'database.sha256'),hashes['database.dump'].toUpperCase());
 console.log(folder);
}catch{console.error('Respaldo no completado. No se imprimen conexión ni credenciales.');process.exitCode=1;}
