import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './utils/create-app';

describe('StatisticsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /statistics/ping should return status', async () => {
    const res = await request(app.getHttpServer())
      .get('/statistics/ping')
      .expect(200);

    const body: { status: string } = res.body as { status: string };
    expect(body).toHaveProperty('status');
    expect(typeof body.status).toBe('string');
  });

  it('GET /statistics/latest-report should return report', async () => {
    const res = await request(app.getHttpServer())
      .get('/statistics/latest-report')
      .expect(200);

    expect(res.body).toHaveProperty('filename');
    expect(res.body).toHaveProperty('content');
    expect(res.body).toHaveProperty('created');
  });
});
