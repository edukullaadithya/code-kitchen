const assert = require('assert');
const path = require('path');

async function testPriority1APIs() {
  console.log('--- TESTING PRIORITY 1 APIS FOR RENTRIGHT ---\n');

  // Test 1: Property Create & Update API (POST /api/listings and PUT /api/listings/:id)
  console.log('[Test 1] Property Create & Update (POST /api/listings & PUT /api/listings/:id)');
  const listingsHandler = require('../api/listings.js');
  const updateListingHandler = require('../api/listings/[id].js');
  const { LISTINGS } = require('../api/_shared/data');

  let mockResBody = null;
  let mockStatusCode = 200;

  const mockRes = {
    setHeader: () => {},
    status: (code) => {
      mockStatusCode = code;
      return {
        json: (data) => { mockResBody = data; return data; },
        end: () => {}
      };
    }
  };

  // Create a listing first
  const createReq = {
    method: 'POST',
    headers: {},
    body: {
      name: 'Grand Cyber Villa',
      city: 'hyderabad',
      area: 'Madhapur',
      price: 85000,
      type: '3BHK',
      ownerEmail: 'adithya@rentright.com'
    }
  };
  await listingsHandler(createReq, mockRes);
  assert.strictEqual(mockStatusCode, 201);
  const testPropId = mockResBody.listing.id;

  const updateReq = {
    method: 'PUT',
    query: { id: testPropId },
    headers: {},
    body: {
      price: 95000,
      description: 'Updated luxury villa with infinity pool and private garden.'
    }
  };

  await updateListingHandler(updateReq, mockRes);
  assert.strictEqual(mockStatusCode, 200, 'PUT /api/listings/:id should return 200');
  assert.strictEqual(mockResBody.success, true, 'Response should indicate success');
  assert.strictEqual(mockResBody.listing.price, 95000, 'Price should be updated to 95000');
  console.log(`✓ Successfully created and updated listing ${testPropId} price to ₹95,000`);

  // Test 2: Saved Favorites API (POST, GET, DELETE /api/favorites)
  console.log('\n[Test 2] Saved Favorites API (/api/favorites)');
  const favoritesHandler = require('../api/favorites.js');
  const deleteFavoriteHandler = require('../api/favorites/[id].js');

  // 2a. Add to favorites
  const addFavReq = {
    method: 'POST',
    headers: {},
    body: {
      listingId: 101,
      userId: 'test_renter_99',
      userEmail: 'renter99@gmail.com'
    }
  };
  await favoritesHandler(addFavReq, mockRes);
  assert.strictEqual(mockStatusCode, 201, 'POST /api/favorites should return 201');
  assert.strictEqual(mockResBody.success, true);
  console.log('✓ Successfully added property 101 to favorites');

  // 2b. Fetch favorites
  const getFavReq = {
    method: 'GET',
    headers: {},
    query: { userId: 'test_renter_99' }
  };
  await favoritesHandler(getFavReq, mockRes);
  assert.strictEqual(mockStatusCode, 200, 'GET /api/favorites should return 200');
  assert.ok(mockResBody.favorites.some(f => String(f.listingId) === '101'), 'Favorites should include 101');
  console.log('✓ Successfully retrieved user favorites count: ' + mockResBody.count);

  // 2c. Delete favorite
  const delFavReq = {
    method: 'DELETE',
    headers: {},
    query: { id: 101, userId: 'test_renter_99' }
  };
  await deleteFavoriteHandler(delFavReq, mockRes);
  assert.strictEqual(mockStatusCode, 200, 'DELETE /api/favorites/:id should return 200');
  console.log('✓ Successfully removed property 101 from favorites');

  // Test 3: Media Upload API (POST /api/upload)
  console.log('\n[Test 3] Image & Media Upload (POST /api/upload)');
  const uploadHandler = require('../api/upload.js');
  const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const uploadReq = {
    method: 'POST',
    headers: {},
    body: {
      image: dummyBase64,
      filename: 'sample_living_room.png'
    }
  };
  await uploadHandler(uploadReq, mockRes);
  assert.strictEqual(mockStatusCode, 201, 'POST /api/upload should return 201');
  assert.strictEqual(mockResBody.success, true);
  assert.strictEqual(mockResBody.mimeType, 'image/png');
  console.log('✓ Successfully uploaded image with mimeType: ' + mockResBody.mimeType);

  // Test 4: Email Notification API (POST /api/notifications/email)
  console.log('\n[Test 4] Email Notification API (POST /api/notifications/email)');
  const emailHandler = require('../api/notifications/email.js');

  const emailReq = {
    method: 'POST',
    headers: {},
    body: {
      to: 'admin@rentright.com',
      subject: 'New Tour Booking Request for Cyber Palms Villa',
      type: 'inquiry_alert',
      data: {
        listingName: 'Cyber Palms Villa',
        userName: 'Rahul Sharma',
        userEmail: 'rahul.s@gmail.com',
        phone: '+91 9876543210',
        moveInDate: '2026-09-15',
        message: 'Looking to schedule a weekend visit.'
      }
    }
  };
  await emailHandler(emailReq, mockRes);
  assert.strictEqual(mockStatusCode, 200, 'POST /api/notifications/email should return 200');
  assert.strictEqual(mockResBody.success, true);
  assert.strictEqual(mockResBody.delivered, true);
  console.log('✓ Successfully dispatched email notification: ' + mockResBody.subject);

  console.log('\n========================================');
  console.log('ALL PRIORITY 1 APIS VERIFIED AND PASSING! 🚀');
  console.log('========================================\n');
}

testPriority1APIs().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
