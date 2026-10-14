import assert from 'node:assert/strict';

const BASE = 'http://localhost:3000';

for (const body of [
  { rawUser: { uid: 'attacker', email: 'victim@example.com' } },
  { idToken: 'invalid-token', rawUser: { uid: 'attacker', email: 'victim@example.com' } },
]) {
  const response = await fetch(`${BASE}/api/auth/token-exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  assert.ok(response.status === 400 || response.status === 401);
  assert.equal(response.headers.get('set-cookie'), null);
}

console.log('PASS: unverified Google profiles cannot create sessions.');
