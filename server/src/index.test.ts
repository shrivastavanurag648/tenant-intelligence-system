/**
 * Basic server tests
 */

import request from 'supertest';
import app from './index';

describe('Server', () => {
  test('health check endpoint works', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('API info endpoint works', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('endpoints');
  });

  test('404 handler works', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Not Found');
  });
});