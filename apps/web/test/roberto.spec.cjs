const {test,expect}=require('@playwright/test');
const path=require('node:path');
const fixture=require('./notifications-fixture.cjs');
const uid='00000000-0000-4000-8000-000000000099';
async function setup(page,permissions=['reports:read:institution','configuration:manage','academic:manage']){
 await fixture(page);
 await page.route('**/api/v1/auth/me',r=>r.fulfill({json:{user:{id:uid,institutionId:uid,displayName:'Prueba visual de Roberto',email:'fixture@example.test',role:'administrador',active:true,teamId:null,permissions},csrfToken:'fixture'}}));
 const metric={mae:7.6,mape:14,zeroExcluded:2,samples:42};
 const result={status:'available',source:'synthetic',origin:'2026-11-25',model:'sarimax',datasetHash:'a'.repeat(64),observationDays:730,totalTickets:43000,from:'2024-11-25',through:'2026-11-24',seed:20261125,engineVersion:'demand-v1',parameters:{order:[1,0,1]},libraries:{statsmodels:'0.14.6'},
 observed:Array.from({length:42},(_,i)=>({date:new Date(Date.parse('2026-10-14')+i*86400000).toISOString().slice(0,10),count:50+i%7})),forecast:Array.from({length:14},(_,i)=>({date:new Date(Date.parse('2026-11-25')+i*86400000).toISOString().slice(0,10),value:70+i,lower:50+i,upper:90+i})),evaluation:{selectedModel:'sarimax',candidateStatus:'available',metrics:{weekly_naive:{...metric,mae:14},sarimax:metric},folds:[{trainThrough:'2026-10-13',testFrom:'2026-10-14',testThrough:'2026-10-27'}],points:[{date:'2026-11-01',observed:50,weekly_naive:48,sarimax:51},{date:'2026-11-02',observed:55,weekly_naive:50,sarimax:53}]}};
 const data={source:'synthetic',status:'available',runId:uid,generatedAt:'2026-11-25T18:00:00Z',stale:false,config:{weeklyCapacity:350,observedFrom:null,version:0},latest:{status:'completed',errorCode:null},result};
 await page.route('**/api/v1/demand**',r=>r.fulfill({json:data}));
 const alert={id:uid,source:'synthetic',weekStart:'2026-11-30',expected:700,capacity:350,active:true,runId:uid,updatedAt:'2026-11-25T18:00:00Z',reviewedAt:null};
 await page.route('**/api/v1/alerts**',r=>r.fulfill({json:r.request().url().includes(uid)?alert:{items:[alert]}}));
 return data;
}
for(const width of [1440,390])test(`Demanda y evaluación accesibles, identificadas y sin desbordamiento ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});await setup(page);
 for(const route of ['demanda','modelos']){
  await page.goto('/'+route+'?source=synthetic');await expect(page.getByRole('heading',{name:route==='demanda'?'Demanda de tickets':'Modelo de demanda',exact:true})).toBeVisible();
  await expect(page.getByText(/No acreditan desempeño en producción/)).toBeVisible();
  await expect(page.getByText('SARIMAX semanal',{exact:true}).first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:path.resolve(__dirname,`../../../.local/roberto-${route}-${width}-fixture.png`),fullPage:true});
 }
});
test('Alertas muestra fuente y revisión sin cambiar prioridades',async({page})=>{
 await setup(page);await page.goto('/alertas/'+uid);
 await expect(page.getByRole('heading',{name:'Detalle de alerta predictiva',exact:true})).toBeVisible();await expect(page.getByText(/no cambia automáticamente turnos/)).toBeVisible();
 await page.getByLabel('Motivo de la revisión').fill('Revisada disponibilidad del equipo.');await page.getByRole('button',{name:'Marcar como revisada'}).click();await expect(page.getByRole('status')).toHaveText(/Alerta marcada como revisada/);
 await page.screenshot({path:path.resolve(__dirname,'../../../.local/roberto-alerta-fixture.png'),fullPage:true});
});
test('Notificaciones filtra y marca una lectura personal',async({page})=>{
 await setup(page,[]);let read=false;
 await page.route('**/api/v1/notifications**',r=>r.fulfill({json:r.request().method()==='PATCH'?(read=true,{read:true}):{items:[{id:uid,type:'resolution',title:'Incidencia resuelta',body:'Aviso ficticio de prueba.',href:'/incidencias',isDemo:true,readAt:read?'2026-11-25':null,createdAt:'2026-11-25T18:00:00Z'}],unreadCount:read?0:1,total:1,page:1,pageSize:30}}));
 await page.goto('/notificaciones');await expect(page.getByRole('heading',{name:'Notificaciones',exact:true})).toBeVisible();await page.getByRole('button',{name:'Marcar como leída'}).click();await expect(page.getByText('0 sin leer',{exact:true})).toBeVisible();
 await page.screenshot({path:path.resolve(__dirname,'../../../.local/roberto-notificaciones-fixture.png'),fullPage:true});
});
test('Permiso revocado bloquea demanda y alerta por URL directa',async({page})=>{
 await setup(page,[]);for(const route of ['/demanda','/alertas/'+uid]){await page.goto(route);await expect(page.getByText('No tienes permiso para acceder a este módulo.',{exact:true})).toBeVisible();}
});
test('CSV del calendario: vista previa y confirmación visible sin segunda importación',async({page})=>{
 await setup(page);let writes=0;
 await page.route('**/api/v1/academic/**',route=>{
  const url=route.request().url();if(url.includes('/imports/')){const confirm=url.includes('/confirm');if(confirm)writes++;return route.fulfill({json:{valid:true,imported:confirm?1:0,duplicates:0,rows:[{row:2,title:'Parcial de demostración',duplicate:false}]}})}
  return route.fulfill({json:{items:[],total:0,page:1,pageSize:100}})
 });
 await page.goto('/admin/calendario');await page.getByRole('button',{name:'Importar CSV'}).click();
 await page.getByLabel('Archivo CSV').setInputFiles({name:'calendario.csv',mimeType:'text/csv',buffer:Buffer.from('title,type,scope,courseCode,sectionCode,startsAt,endsAt\nParcial de demostración,examen,institution,,,2026-12-01T09:00:00-05:00,2026-12-01T11:00:00-05:00')});
 await page.getByLabel('Motivo de la importación').fill('Programación ficticia para prueba.');await page.getByRole('button',{name:'Ver vista previa'}).click();expect(writes).toBe(0);
 await page.getByRole('button',{name:'Confirmar importación'}).click();await expect(page.getByText('1 eventos importados.',{exact:false})).toBeVisible();expect(writes).toBe(1);await expect(page.getByRole('button',{name:'Confirmar importación'})).toHaveCount(0);
 await page.screenshot({path:path.resolve(__dirname,'../../../.local/roberto-csv-fixture.png'),fullPage:true});
});
