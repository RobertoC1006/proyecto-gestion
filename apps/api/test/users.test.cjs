require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { Test } = require('@nestjs/testing');
const { UnauthorizedException } = require('@nestjs/common');
const { AppModule } = require('../dist/app.module');
const { AuthProvider } = require('../dist/auth/auth.provider');
const { AuthConfig } = require('../dist/auth/auth.config');
const { PrismaService } = require('../dist/database/prisma.service');

test('Usuarios: permisos, persistencia y validación HTTP en PostgreSQL aislado', async t => {
  assert.equal(new URL(process.env.DATABASE_URL).hostname, 'db');
  const institutionId = randomUUID(), foreignInstitution = randomUUID();
  const identities = new Map(), tokens = new Map();
  const config = new AuthConfig();
  Object.defineProperty(config, 'institutionCode', { value: 'USERS-TEST' });
  const provider = {
    async login(email) { const user=identities.get(email); if(!user) throw new UnauthorizedException(); const access=randomBytes(24).toString('hex'); tokens.set(access,user); return {access,refresh:'isolated-test',expiresAt:Math.floor(Date.now()/1000)+3600}; },
    async validate(token) { const user=tokens.get(token); if(!user) throw new UnauthorizedException(); return user; },
    async revoke() {},
  };
  const module = await Test.createTestingModule({imports:[AppModule]}).overrideProvider(AuthProvider).useValue(provider).overrideProvider(AuthConfig).useValue(config).compile();
  const app=module.createNestApplication({logger:false}); app.setGlobalPrefix('api/v1'); await app.listen(0,'127.0.0.1');
  const db=app.get(PrismaService), base=await app.getUrl();
  const admin={id:randomUUID(),email:'admin-users@example.test',displayName:'A Admin',role:'administrador'};
  const student={id:randomUUID(),email:'student-users@example.test',displayName:'B Estudiante',role:'estudiante'};
  const teacher={id:randomUUID(),email:'teacher-users@example.test',displayName:'C Docente',role:'docente'};
  const outsider={id:randomUUID(),email:'foreign-users@example.test',displayName:'Z Externo',role:'administrador'};
  for(const u of [admin,student,teacher,outsider]) identities.set(u.email,u);
  async function request(path,{method='GET',body,session,headers={}}={}) {
    const response=await fetch(`${base}/api/v1/${path}`,{method,headers:{origin:'http://localhost:8080','content-type':'application/json',...(session?{cookie:session.cookie,'x-csrf-token':session.csrf}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
    return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')};
  }
  async function login(user) { const r=await request('auth/login',{method:'POST',body:{email:user.email,password:'Password-test-123'}}); assert.equal(r.status,200); return {cookie:r.cookie.split(';')[0],csrf:r.body.csrfToken}; }
  const update=(extra={})=>({expectedVersion:1,role:'docente',active:true,teamId:null,reason:'Cambio autorizado en base aislada',...extra});
  let session, studentSession, team, foreignTeam;
  try {
    await db.institution.createMany({data:[{id:institutionId,code:'USERS-TEST',name:'Institucion de prueba'},{id:foreignInstitution,code:'USERS-FOREIGN',name:'Institucion ajena'}]});
    team=await db.supportTeam.create({data:{institutionId,code:'USERS-TI',name:'Soporte propio'}});
    foreignTeam=await db.supportTeam.create({data:{institutionId:foreignInstitution,code:'USERS-TI',name:'Soporte ajeno'}});
    await db.appUser.createMany({data:[{...admin,institutionId},{...student,institutionId,teamId:team.id},{...teacher,institutionId,active:false},{...outsider,institutionId:foreignInstitution}]});
    session=await login(admin); studentSession=await login(student);
    await t.test('Sin sesion 401 y sin permiso 403 para todas las rutas',async()=>{
      for(const path of ['users','users/teams',`users/${student.id}`]) {
        assert.equal((await request(path)).status,401);
        assert.equal((await request(path,{session:studentSession})).status,403);
      }
      assert.equal((await request(`users/${teacher.id}/access`,{method:'PATCH',body:update(),session:studentSession})).status,403);
    });
    await t.test('Listado, filtros reales, paginacion y catalogo aislan institucion',async()=>{
      const all=await request('users',{session}); assert.equal(all.status,200); assert.equal(all.body.total,3); assert.ok(all.body.items.every(u=>u.institutionId===institutionId));
      const search=await request('users?search=ESTUDIANTE',{session}); assert.deepEqual(search.body.items.map(u=>u.id),[student.id]);
      const role=await request('users?role=docente',{session}); assert.deepEqual(role.body.items.map(u=>u.id),[teacher.id]);
      const inactive=await request('users?active=false',{session}); assert.deepEqual(inactive.body.items.map(u=>u.id),[teacher.id]);
      const byTeam=await request(`users?teamId=${team.id}`,{session}); assert.deepEqual(byTeam.body.items.map(u=>u.id),[student.id]);
      const page=await request('users?page=2&pageSize=1',{session}); assert.equal(page.body.total,3); assert.equal(page.body.items.length,1); assert.equal(page.body.items[0].id,student.id);
      const teams=await request('users/teams',{session}); assert.deepEqual(teams.body.map(r=>r.id),[team.id]);
    });
    await t.test('Identificador ajeno: 404 al leer y escribir, sin auditoria',async()=>{
      assert.equal((await request(`users/${outsider.id}`,{session})).status,404);
      assert.equal((await request(`users/${outsider.id}/access`,{method:'PATCH',body:update(),session})).status,404);
      assert.equal(await db.identityChange.count({where:{institutionId}}),0);
    });
    await t.test('Origin y CSRF invalidos bloquean el cambio sin escribir',async()=>{
      for(const headers of [{'x-csrf-token':'incorrecto'},{origin:'https://foreign.example.test'}]) assert.equal((await request(`users/${student.id}/access`,{method:'PATCH',body:update(),session,headers})).status,403);
      assert.equal(await db.identityChange.count({where:{institutionId}}),0);
    });
    await t.test('Guardado persiste rol, estado, equipo y auditoria atomica; invalida sesion anterior',async()=>{
      const changed=await request(`users/${student.id}/access`,{method:'PATCH',body:update({teamId:team.id}),session});
      assert.equal(changed.status,200); assert.equal(changed.body.role,'docente'); assert.equal(changed.body.accessVersion,2); assert.equal(changed.body.teamId,team.id);
      const stored=await db.appUser.findUnique({where:{id:student.id}}); assert.equal(stored.role,'docente'); assert.equal(stored.accessVersion,2);
      const logs=await db.identityChange.findMany({where:{institutionId,subjectId:student.id}}); assert.equal(logs.length,1); assert.equal(logs[0].actorId,admin.id); assert.equal(logs[0].before.role,'estudiante'); assert.equal(logs[0].after.role,'docente'); assert.equal(logs[0].reason,update().reason);
      assert.equal((await request('auth/me',{session:studentSession})).status,401);
    });
    await t.test('Conserva validacion comun, conflicto de version y ultimo administrador',async()=>{
      assert.equal((await request(`users/${student.id}/access`,{method:'PATCH',body:update(),session})).status,409);
      assert.equal((await request(`users/${admin.id}/access`,{method:'PATCH',body:update({role:'estudiante'}),session})).status,409);
      assert.equal((await request(`users/${teacher.id}/access`,{method:'PATCH',body:update({role:'inventado'}),session})).status,400);
      assert.equal((await request(`users/${teacher.id}/access`,{method:'PATCH',body:update({teamId:foreignTeam.id}),session})).status,400);
    });
    await t.test('Dos escrituras simultaneas: solo una se guarda y audita',async()=>{
      const paths=`users/${teacher.id}/access`;
      const responses=await Promise.all([request(paths,{method:'PATCH',body:update({role:'ti_agente'}),session}),request(paths,{method:'PATCH',body:update({role:'estudiante'}),session})]);
      assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]); assert.equal(await db.identityChange.count({where:{subjectId:teacher.id}}),1);
    });
    await t.test('Paginacion decimal debe rechazarse con 400, no error interno',async()=>{
      const r=await request('users?page=1.5&pageSize=2.5',{session}); assert.equal(r.status,400);
    });
    await t.test('Rechaza filtros, límites y parámetros ajenos al contrato',async()=>{
      for (const query of ['pageSize=2.5', 'page=Infinity', 'page=100001', 'page=0', 'page=-1', 'pageSize=101', 'role=inventado', 'active=talvez', 'teamId=no-es-uuid', 'institutionId=' + foreignInstitution, 'search=' + 'x'.repeat(101)]) {
        const r=await request('users?' + query,{session}); assert.equal(r.status,400,query); assert.equal(r.body.code,'VALIDATION_ERROR',query);
      }
    });
    await t.test('UUID malformado debe rechazarse con 400, no error interno',async()=>{
      for (const method of ['GET', 'PATCH']) { const path = 'users/no-es-un-uuid' + (method === 'PATCH' ? '/access' : ''); const r = await request(path, {method, session, body:method === 'PATCH' ? update() : undefined}); assert.equal(r.status,400); assert.equal(r.body.code,'VALIDATION_ERROR'); }
    });
  } finally { await app.close(); }
});
