import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './utils/create-app';

describe('DashboardSettingsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('PUT /dashboard-settings should save layout', async () => {
    const res = await request(app.getHttpServer())
      .put('/dashboard-settings')
      .send({
        layout: [{ id: 'widget1', x: 0, y: 0, w: 4, h: 3 }],
      })
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it('GET /dashboard-settings should return layout', async () => {
    const res = await request(app.getHttpServer())
      .get('/dashboard-settings')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
