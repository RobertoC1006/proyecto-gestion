// El usuario de interfaz es ficticio: ninguna consulta lateral usa una sesión real.
module.exports = async page => {
  await page.route('**/api/v1/notifications**', route => route.fulfill({contentType:'application/json',body:JSON.stringify({items:[],total:0,unreadCount:0,page:1,pageSize:30})}));
  await page.route('**/api/v1/notifications/events', route => route.fulfill({contentType:'text/event-stream',body:'data: {"refresh":true}\n\n'}));
};
