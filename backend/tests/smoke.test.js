const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');
const db = require('../db');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

let server;
let baseUrl;
let authHeader;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
  const [admins] = await db.promise().query("SELECT uId, uUsername, roleId FROM users WHERE flag=1 AND uStatus='Active' AND roleId=1 LIMIT 1");
  assert.ok(admins.length, 'An active administrator is required for integration tests');
  authHeader = `Bearer ${jwt.sign({ id: admins[0].uId, username: admins[0].uUsername, roleId: admins[0].roleId }, jwtSecret, { expiresIn: '5m' })}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.promise().end();
});

test('health endpoint responds', async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'Backend Running Successfully');
});

test('protected endpoints reject anonymous requests', async () => {
  const response = await fetch(`${baseUrl}/api/inventory`);
  assert.equal(response.status, 403);
});

test('malformed bearer tokens are rejected', async () => {
  const response = await fetch(`${baseUrl}/api/inventory`, { headers: { Authorization: 'invalid' } });
  assert.equal(response.status, 401);
});

test('public registration is disabled', async () => {
  const response = await fetch(`${baseUrl}/register`, { method: 'POST' });
  assert.equal(response.status, 403);
});

test('authenticated inventory and report endpoints respond', async () => {
  for (const path of ['/api/dashboard/stats', '/api/inventory', '/api/reports/monthly', '/api/reports/stock-transactions']) {
    const response = await fetch(`${baseUrl}${path}`, { headers: { Authorization: authHeader } });
    assert.equal(response.status, 200, `${path} returned ${response.status}`);
    const body = await response.json();
    assert.equal(body.success, true);
  }
});
