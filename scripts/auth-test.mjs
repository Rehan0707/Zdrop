import assert from 'node:assert/strict';

const BASE = process.env.ZDROP_TEST_URL || 'http://localhost:3000';

async function waitForServer() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${BASE}/api/auth/me`);
      if (res.status === 200) return;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Dev server did not start in time.');
}

async function runTests() {
  console.log('Waiting for server...');
  await waitForServer();
  console.log('Dev server ready. Testing auth endpoints...');

  // 1. Initial /api/auth/me should be null
  const me1 = await (await fetch(`${BASE}/api/auth/me`)).json();
  assert.equal(me1.user, null, 'Unauthenticated user should be null');
  assert.equal(me1.shop, null, 'Unauthenticated shop should be null');
  console.log('✔ Test 1 passed: /api/auth/me returns null unauthenticated');

  // 2. Google sign in (mock-google)
  const googleRes = await fetch(`${BASE}/api/auth/mock-google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Rohan Student', email: 'rohan.student@college.edu' })
  });
  if (googleRes.status === 404) {
    assert.equal(googleRes.headers.get('set-cookie'), null, 'Production mock auth must not set a cookie');
    console.log('✔ Tests 2–3 passed: production mock sign-in is unavailable');
  } else {
    assert.equal(googleRes.status, 200, 'Development mock Google auth should succeed');
    const googleData = await googleRes.json();
    assert.equal(googleData.user.email, 'rohan.student@college.edu');
    assert.equal(googleData.user.role, 'user');
    const userCookie = googleRes.headers.get('set-cookie');
    assert.ok(userCookie, 'Auth cookie should be set');
    console.log('✔ Test 2 passed: development mock sign-in succeeds and sets cookie');

    const me2 = await (await fetch(`${BASE}/api/auth/me`, {
      headers: { cookie: userCookie }
    })).json();
    assert.equal(me2.user.email, 'rohan.student@college.edu');
    assert.equal(me2.user.role, 'user');
    assert.equal(me2.shop, null);
    console.log('✔ Test 3 passed: /api/auth/me returns development user profile');
  }

  // 4. Shop owner registration
  const uniqueCode = `SHOP${Date.now().toString().slice(-4)}`;
  const regRes = await fetch(`${BASE}/api/auth/shop/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shopName: 'Campus Xerox & Stationary',
      ownerName: 'Ramesh Sharma',
      email: `ramesh.${Date.now()}@xerox.com`,
      password: 'password123',
      phone: '+91 9876543210',
      campusAddress: 'Library Ground Floor',
      shopCode: uniqueCode,
    })
  });
  assert.equal(regRes.status, 200, 'Shop registration should succeed');
  const regData = await regRes.json();
  assert.equal(regData.user.role, 'shop_owner');
  assert.equal(regData.shop.shopName, 'Campus Xerox & Stationary');
  assert.equal(regData.shop.shopCode, uniqueCode);
  const shopCookie = regRes.headers.get('set-cookie');
  assert.ok(shopCookie, 'Shop owner auth cookie should be set');
  console.log('✔ Test 4 passed: Shop owner registration succeeds');

  // 5. /api/auth/me with shop owner cookie
  const me3 = await (await fetch(`${BASE}/api/auth/me`, {
    headers: { cookie: shopCookie }
  })).json();
  assert.equal(me3.user.role, 'shop_owner');
  assert.ok(me3.shop, 'Shop profile should be attached');
  assert.equal(me3.shop.shopCode, uniqueCode);
  console.log('✔ Test 5 passed: /api/auth/me returns shop owner + shop profile');

  // 6. List shops
  const shopsRes = await (await fetch(`${BASE}/api/shops`)).json();
  assert.ok(Array.isArray(shopsRes.shops), 'Shops list should be an array');
  const foundShop = shopsRes.shops.find(s => s.shopCode === uniqueCode);
  assert.ok(foundShop, 'Newly created shop should be listed in active shops');
  console.log('✔ Test 6 passed: /api/shops includes newly registered shop');

  // 7. Get shop by code
  const shopByCode = await (await fetch(`${BASE}/api/shops/${uniqueCode}`)).json();
  assert.equal(shopByCode.shop.shopCode, uniqueCode);
  assert.equal(shopByCode.shop.shopName, 'Campus Xerox & Stationary');
  console.log('✔ Test 7 passed: /api/shops/[code] finds shop by code');

  // 8. Logout
  const logoutRes = await fetch(`${BASE}/api/auth/logout`, { method: 'POST' });
  assert.equal(logoutRes.status, 200);
  const clearedCookie = logoutRes.headers.get('set-cookie');
  assert.ok(clearedCookie.includes('Max-Age=0') || clearedCookie.includes('Expires=Thu, 01 Jan 1970'), 'Cookie should be cleared on logout');
  console.log('✔ Test 8 passed: Logout clears session cookie');

  console.log('\n🎉 ALL 8 AUTH AND SHOP TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
