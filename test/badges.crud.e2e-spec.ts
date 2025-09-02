import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './utils/create-app';

describe('Badges CRUD lifecycle (e2e)', () => {
  let app: INestApplication;
  let id: number;

  beforeAll(async () => {
    app = await createTestApp();
  }, 20000);

  afterAll(async () => {
    await app.close();
  });

  it('should create, read, update and delete a badge', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/badges')
      .send({
        name: 'First badge',
        description: 'Badge description',
        icon: 'icon.png',
      })
      .expect(201);

    id = createRes.body.id;
    expect(createRes.body.name).toBe('First badge');

    const readRes = await request(app.getHttpServer())
      .get(`/badges/${id}`)
      .expect(200);

    expect(readRes.body.id).toBe(id);
    expect(readRes.body.name).toBe('First badge');

    const updateRes = await request(app.getHttpServer())
      .patch(`/badges/${id}`)
      .send({ name: 'Updated badge' })
      .expect(200);

    expect(updateRes.body.id).toBe(id);
    expect(updateRes.body.name).toBe('Updated badge');

    const confirmRes = await request(app.getHttpServer())
      .get(`/badges/${id}`)
      .expect(200);

    expect(confirmRes.body.name).toBe('Updated badge');

    await request(app.getHttpServer())
      .delete(`/badges/${id}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/badges/${id}`)
      .expect(404);
  });
});
