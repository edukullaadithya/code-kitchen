const assert = require('assert');

async function testPriority2APIs() {
  console.log('--- TESTING PRIORITY 2 APIS (SECURITY & COMMUNICATION) ---\n');

  const authHandler = require('../api/auth/[action].js');
  const reviewsHandler = require('../api/reviews.js');
  const messagesHandler = require('../api/messages.js');
  const messageManageHandler = require('../api/messages/[id].js');

  let mockResBody = null;
  let mockStatusCode = 200;

  function createRes() {
    return {
      setHeader: () => {},
      status: (code) => {
        mockStatusCode = code;
        return {
          json: (data) => { mockResBody = data; return data; },
          end: () => {}
        };
      }
    };
  }

  // Register a unique test account per run
  const testEmail = 'security.' + Date.now() + '@rentright.com';
  const regReq = {
    method: 'POST',
    query: { action: 'register' },
    headers: {},
    body: {
      name: 'Security Test User',
      email: testEmail,
      password: 'initialPassword123',
      role: 'user'
    }
  };
  await authHandler(regReq, createRes());
  assert.strictEqual(mockStatusCode, 201);
  console.log(`✓ Created test user account: ${testEmail}`);

  // ===== 1. FORGOT PASSWORD (OTP GENERATION) =====
  console.log('\n[Test 1] Password Reset - Request OTP (/api/auth/forgot-password)');
  const forgotReq = {
    method: 'POST',
    query: { action: 'forgot-password' },
    headers: {},
    body: { email: testEmail }
  };
  await authHandler(forgotReq, createRes());
  assert.strictEqual(mockStatusCode, 200);
  assert.strictEqual(mockResBody.success, true);
  assert.ok(mockResBody.otp && mockResBody.otp.length === 6);
  const receivedOtp = mockResBody.otp;
  console.log(`✓ OTP code generated successfully: ${receivedOtp} (Expires in 15 mins)`);

  // ===== 2. RESET PASSWORD (VERIFY OTP & UPDATE) =====
  console.log('\n[Test 2] Password Reset - Verify OTP & Set New Password (/api/auth/reset-password)');
  const resetReq = {
    method: 'POST',
    query: { action: 'reset-password' },
    headers: {},
    body: {
      email: testEmail,
      otp: receivedOtp,
      newPassword: 'myBrandNewPassword2026'
    }
  };
  await authHandler(resetReq, createRes());
  assert.strictEqual(mockStatusCode, 200);
  assert.strictEqual(mockResBody.success, true);
  console.log('✓ Password reset verified with OTP & updated on disk!');

  // Verify login with new password
  const newLoginReq = {
    method: 'POST',
    query: { action: 'login' },
    headers: {},
    body: {
      email: testEmail,
      password: 'myBrandNewPassword2026'
    }
  };
  await authHandler(newLoginReq, createRes());
  assert.strictEqual(mockStatusCode, 200);
  const userToken = mockResBody.token;
  console.log('✓ Successfully authenticated using the new reset password!');

  // ===== 3. RATINGS & TENANT REVIEWS API =====
  console.log('\n[Test 3] Ratings & Reviews API (POST & GET /api/reviews)');
  const testListingId = 'prop_' + Date.now();
  const newReviewReq = {
    method: 'POST',
    headers: { authorization: 'Bearer ' + userToken },
    body: {
      listingId: testListingId,
      listingName: 'HKS Luxury Residency',
      rating: 5,
      safetyScore: 5,
      landlordScore: 4.8,
      waterPowerScore: 5,
      comment: 'Excellent gated society with 24/7 power backup and super cooperative landlord.',
      tenantStatus: 'Verified Resident (1 yr)'
    }
  };
  await reviewsHandler(newReviewReq, createRes());
  assert.strictEqual(mockStatusCode, 201);
  assert.strictEqual(mockResBody.success, true);
  const reviewId = mockResBody.review.id;
  console.log('✓ Submitted verified tenant review with ID:', reviewId);

  // 3b. Fetch reviews & check aggregates
  const getReviewsReq = {
    method: 'GET',
    query: { listingId: testListingId }
  };
  await reviewsHandler(getReviewsReq, createRes());
  assert.strictEqual(mockStatusCode, 200);
  assert.strictEqual(mockResBody.totalCount, 1);
  assert.strictEqual(mockResBody.aggregates.averageRating, 5);
  console.log(`✓ Retrieved reviews for listing ${testListingId}. Avg: ${mockResBody.aggregates.averageRating}★, Safety: ${mockResBody.aggregates.safetyRating}★`);

  // ===== 4. IN-APP MESSAGING & CHAT API =====
  console.log('\n[Test 4] In-App Messaging & Live Chat API (POST & GET /api/messages)');
  const sendMsgReq = {
    method: 'POST',
    headers: { authorization: 'Bearer ' + userToken },
    body: {
      listingId: testListingId,
      listingName: 'HKS Luxury Residency',
      recipientEmail: 'manager@rentright.com',
      recipientName: 'Vikram (Property Manager)',
      message: 'Hi Vikram, is this property available for immediate move-in?'
    }
  };
  await messagesHandler(sendMsgReq, createRes());
  assert.strictEqual(mockStatusCode, 201);
  assert.strictEqual(mockResBody.success, true);
  const msgId = mockResBody.message.id;
  console.log('✓ Sent chat message with ID:', msgId);

  // 4b. Retrieve conversation thread
  const getThreadReq = {
    method: 'GET',
    headers: { authorization: 'Bearer ' + userToken },
    query: { chatWith: 'manager@rentright.com', listingId: testListingId }
  };
  await messagesHandler(getThreadReq, createRes());
  assert.strictEqual(mockStatusCode, 200);
  assert.strictEqual(mockResBody.messages.length, 1);
  assert.strictEqual(mockResBody.messages[0].message, 'Hi Vikram, is this property available for immediate move-in?');
  console.log('✓ Retrieved active chat thread with 1 chronological message');

  // 4c. Mark message as read
  const markReadReq = {
    method: 'PUT',
    query: { id: msgId }
  };
  await messageManageHandler(markReadReq, createRes());
  assert.strictEqual(mockStatusCode, 200);
  assert.strictEqual(mockResBody.message.read, true);
  console.log('✓ Message marked as read with timestamp');

  console.log('\n========================================');
  console.log('ALL PRIORITY 2 APIS VERIFIED AND PASSING! 🚀');
  console.log('========================================\n');
}

testPriority2APIs().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
