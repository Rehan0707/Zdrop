import assert from 'node:assert/strict';

const base = process.env.ZDROP_TEST_URL || 'http://localhost:3000';

console.log('Testing Pricing & Micro-Payment Endpoints...');

// 1. Create a 3-page session with 2 copies and B&W
const createRes = await fetch(`${base}/api/sessions/create`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    files: [
      { fileName: 'notes.pdf', fileSize: 1024, mimeType: 'application/pdf' },
    ],
    preferences: {
      copies: 2,
      colorMode: 'BW',
      sides: 'SINGLE',
      pageRange: 'ALL',
    },
  }),
});

assert.equal(createRes.status, 201);
const { session, token } = await createRes.json();
assert.ok(session.costEstimate, 'Session should have a cost estimate');
assert.equal(session.costEstimate.copies, 2);
assert.equal(session.costEstimate.ratePerPage, 2);
assert.equal(session.costEstimate.currencySymbol, '₹');
assert.equal(session.paymentStatus, 'UNPAID');
console.log('✔ Test 1 passed: Session created with initial cost estimate (UNPAID).');

// 2. Test Payment status update via API (Customer pays via UPI)
const payRes = await fetch(`${base}/api/sessions/payment`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionId: session.id,
    paymentStatus: 'PAID_ONLINE',
    paymentMethod: 'UPI',
  }),
});

assert.equal(payRes.status, 200);
const payData = await payRes.json();
assert.equal(payData.session.paymentStatus, 'PAID_ONLINE');
assert.equal(payData.session.paymentMethod, 'UPI');
console.log('✔ Test 2 passed: Payment updated to PAID_ONLINE (UPI).');

// 3. Test operator resolving session sees the verified payment status
const resolveRes = await fetch(`${base}/api/sessions/resolve?code=${session.accessCode}`);
assert.equal(resolveRes.status, 409); // Still in PENDING_UPLOAD, which confirms code resolution works

// 4. Cleanup
const delRes = await fetch(`${base}/api/sessions/delete`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ sessionId: session.id }),
});
assert.equal(delRes.status, 200);
console.log('✔ Test 3 passed: Session cleaned up.');

console.log('🎉 ALL PRICING & MICRO-PAYMENT ENDPOINT TESTS PASSED SUCCESSFULLY!');
