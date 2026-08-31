const assert = require('assert');

async function testAdminUserAPIs() {
  console.log('--- TESTING IMPROVED ADMINS AND USERS APIS ---\n');

  const authHandler = require('../api/auth/[action].js');
  const adminUsersHandler = require('../api/admin/users.js');
  const adminUserManageHandler = require('../api/admin/users/[id].js');
  const adminAnalyticsHandler = require('../api/admin/analytics.js');
  const inquiriesHandler = require('../api/inquiries.js');
  const inquiryManageHandler = require('../api/inquiries/[id].js');

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

  // ===== 1. REGISTER NEW USER =====
  console.log('[Test 1] User Registration & Persistent Storage');
  const regReq = {
    method: 'POST',
    query: { action: 'register' },
    headers: {},
    body: {
      name: 'Adithya Renter',
      email: 'adithya.test@rentright.com',
      password: 'password123',
      role: 'user',
      phone: '+91 9988776655',
      preferredCity: 'hyderabad'
    }
  };
  await authHandler(regReq, createRes());
  assert.strictEqual(mockStatusCode, 201);
  assert.strictEqual(mockResBody.success, true);
  const userToken = mockResBody.token;
  const createdUserId = mockResBody.user.id;
  console.log('✓ Successfully registered user with token:', userToken.slice(0, 8) + '...');

  // ===== 2. GET CURRENT PROFILE & UPDATE PROFILE =====
  console.log('\n[Test 2] Profile Retrieval & Profile Update');
  const updateProfileReq = {
    method: 'PUT',
    query: { action: 'profile' },
    headers: { authorization: 'Bearer ' + userToken },
    body: {
      name: 'Adithya E. (VIP)',
      phone: '+91 9123456780',
      preferredBudget: 45000,
      preferredBhk: '3BHK',
      bio: 'Software Architect looking for high-rise flat near tech parks.'
    }
  };
  await authHandler(updateProfileReq, createRes());
  assert.strictEqual(mockStatusCode, 200);
  assert.strictEqual(mockResBody.success, true);
  assert.strictEqual(mockResBody.user.name, 'Adithya E. (VIP)');
  console.log('✓ Successfully updated profile name, phone, budget preference, and bio');

  // ===== 3. PASSWORD CHANGE =====
  console.log('\n[Test 3] Password Change API');
  const changePassReq = {
    method: 'POST',
    query: { action: 'change-password' },
    headers: { authorization: 'Bearer ' + userToken },
    body: {
      currentPassword: 'password123',
      newPassword: 'newSuperPassword2026'
    }
  };
  await authHandler(changePassReq, createRes());
  assert.strictEqual(mockStatusCode, 200);
  assert.strictEqual(mockResBody.success, true);
  console.log('✓ Successfully updated password securely');

  // ===== 4. REGISTER ADMIN ACCOUNT =====
  console.log('\n[Test 4] Admin Registration & Directory Listing');
  const adminRegReq = {
    method: 'POST',
    query: { action: 'register' },
    headers: {},
    body: {
      name: 'Super Admin',
      email: 'superadmin@rentright.com',
      password: 'adminPassword123',
      role: 'admin',
      phone: '+91 8877665544'
    }
  };
  await authHandler(adminRegReq, createRes());
  assert.strictEqual(mockStatusCode, 201);
  const adminToken = mockResBody.token;

  // 4b. Query Admin Directory
  const adminListReq = {
    method: 'GET',
    headers: { authorization: 'Bearer ' + adminToken },
    query: {}
  };
  await adminUsersHandler(adminListReq, createRes());
  assert.strictEqual(mockStatusCode, 200);
  assert.ok(mockResBody.users.length >= 2);
  console.log(`✓ Admin fetched user directory. Total Users: ${mockResBody.totalCount}, Admins: ${mockResBody.adminsCount}, Renters: ${mockResBody.rentersCount}`);

  // ===== 5. ADMIN USER ROLE & STATUS UPDATE =====
  console.log('\n[Test 5] Admin User Role / Status Modification');
  const userManageReq = {
    method: 'PUT',
    query: { id: createdUserId },
    headers: { authorization: 'Bearer ' + adminToken },
    body: {
      status: 'active',
      role: 'admin' // Promote to admin
    }
  };
  await adminUserManageHandler(userManageReq, createRes());
  assert.strictEqual(mockStatusCode, 200);
  assert.strictEqual(mockResBody.user.role, 'admin');
  console.log('✓ Admin successfully promoted user role to admin');

  // ===== 6. ADMIN PLATFORM ANALYTICS =====
  console.log('\n[Test 6] Admin Platform Analytics & KPIs');
  const analyticsReq = {
    method: 'GET',
    headers: { authorization: 'Bearer ' + adminToken }
  };
  await adminAnalyticsHandler(analyticsReq, createRes());
  assert.strictEqual(mockStatusCode, 200);
  assert.ok(mockResBody.summary !== undefined);
  console.log('✓ Admin Analytics KPI generated: Total Users =', mockResBody.summary.totalUsers);

  // ===== 7. INQUIRY WORKFLOW (SUBMIT & UPDATE STATUS) =====
  console.log('\n[Test 7] Tenant Inquiry & Admin Status Workflow');
  const newInqReq = {
    method: 'POST',
    headers: { authorization: 'Bearer ' + userToken },
    body: {
      listingId: '1003',
      listingName: 'HKS Luxury Residency',
      ownerEmail: 'superadmin@rentright.com',
      userName: 'Adithya E.',
      userEmail: 'adithya.test@rentright.com',
      phone: '+91 9988776655',
      preferredTourSlot: 'Saturday 11:00 AM',
      message: 'Can I visit with family this Saturday?'
    }
  };
  await inquiriesHandler(newInqReq, createRes());
  assert.strictEqual(mockStatusCode, 201);
  const inqId = mockResBody.inquiry.id;
  console.log('✓ Tenant submitted tour inquiry with ID:', inqId);

  // 7b. Admin confirms inquiry
  const confirmInqReq = {
    method: 'PUT',
    query: { id: inqId },
    headers: { authorization: 'Bearer ' + adminToken },
    body: {
      status: 'confirmed',
      adminNotes: 'Confirmed for Saturday 11:00 AM. Key handover with building manager.',
      scheduledTourDate: '2026-09-05T11:00:00Z'
    }
  };
  await inquiryManageHandler(confirmInqReq, createRes());
  assert.strictEqual(mockStatusCode, 200);
  assert.strictEqual(mockResBody.inquiry.status, 'confirmed');
  console.log('✓ Admin confirmed tour inquiry and added notes');

  // 7c. Renter queries sent inquiries
  const renterInqReq = {
    method: 'GET',
    headers: { authorization: 'Bearer ' + userToken },
    query: { type: 'sent' }
  };
  await inquiriesHandler(renterInqReq, createRes());
  assert.strictEqual(mockStatusCode, 200);
  assert.strictEqual(mockResBody.inquiries[0].status, 'confirmed');
  console.log('✓ Renter retrieved sent inquiries list, showing status: "confirmed"');

  console.log('\n========================================');
  console.log('ALL ADMIN AND USER APIS PASSING SUCCESSFULLY! 🚀');
  console.log('========================================\n');
}

testAdminUserAPIs().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
