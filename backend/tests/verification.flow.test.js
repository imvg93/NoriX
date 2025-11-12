const request = require('supertest');
const appServer = require('../dist/index.js'); // Ensure server exports app or server for tests

describe('Verification flow (scaffold)', () => {
  it('GET /api/verification/status should require auth', async () => {
    const res = await request('http://localhost:5000').get('/api/verification/status');
    expect([401, 403]).toContain(res.status);
  });

  it('Admin pending endpoint should require admin auth', async () => {
    const res = await request('http://localhost:5000').get('/api/admin/verification/pending');
    expect([401, 403]).toContain(res.status);
  });
});


