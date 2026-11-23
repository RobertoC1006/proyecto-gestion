require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { AuditController } = require('../dist/audit/audit.controller');

function fakeResponse() {
  const response = new EventEmitter();
  response.headersSent = false;
  response.destroyed = false;
  response.endCalls = 0;
  response.setHeader = () => response;
  response.write = chunk => {
    assert.equal(chunk, 'header');
    response.headersSent = true;
    return false;
  };
  response.end = () => { response.endCalls++; };
  response.destroy = error => {
    response.destroyed = true;
    response.destroyError = error;
  };
  return response;
}

for (const event of ['drain', 'close']) {
  test(`AuditController export: ${event} settles backpressure and removes both listeners`, async () => {
    const actor = { institutionId: 'isolated-controller-test' };
    const query = { action: 'consent.accept' };
    const response = fakeResponse();
    let writeResult;
    const audit = {
      async export(receivedActor, receivedQuery, write) {
        assert.equal(receivedActor, actor);
        assert.equal(receivedQuery, query);
        writeResult = await write('header');
      },
    };
    const controller = new AuditController(audit);
    const pending = controller.export({ campusPrincipal: actor }, query, response);
    assert.equal(response.headersSent, true);
    assert.equal(response.listenerCount('drain'), 1);
    assert.equal(response.listenerCount('close'), 1);
    assert.equal(response.endCalls, 0);
    response.emit(event);
    await pending;
    assert.equal(writeResult, event === 'drain');
    assert.equal(response.listenerCount('drain'), 0);
    assert.equal(response.listenerCount('close'), 0);
    assert.equal(response.endCalls, 1);
  });
}

test('AuditController export: failure after headers destroys with the original error, never ends', async () => {
  const response = fakeResponse();
  const failure = new Error('transaction timeout');
  const audit = {
    async export(actor, query, write) {
      await write('header');
      throw failure;
    },
  };
  const controller = new AuditController(audit);
  const pending = controller.export({ campusPrincipal: {} }, {}, response);
  assert.equal(response.headersSent, true);
  response.emit('drain');
  await pending;
  assert.equal(response.destroyed, true);
  assert.equal(response.destroyError, failure);
  assert.equal(response.endCalls, 0);
  assert.equal(response.listenerCount('drain'), 0);
  assert.equal(response.listenerCount('close'), 0);
});
