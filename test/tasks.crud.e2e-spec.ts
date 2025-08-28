import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './utils/create-app';

describe('Tasks CRUD lifecycle (e2e)', () => {
  let app: INestApplication;
  let id: number;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create, read, update and delete a task', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'crud task' })
      .expect(201);

    id = createRes.body.id;
    expect(createRes.body.title).toBe('crud task');

    const readRes = await request(app.getHttpServer())
      .get(`/tasks/${id}`)
      .expect(200);

    expect(readRes.body.id).toBe(id);
    expect(readRes.body.title).toBe('crud task');

    const updateRes = await request(app.getHttpServer())
      .patch(`/tasks/${id}`)
      .send({ title: 'crud task updated' })
      .expect(200);

    expect(updateRes.body.title).toBe('crud task updated');

    // сравнить поля -> createRes / updateRes

    const confirmRes = await request(app.getHttpServer())
      .get(`/tasks/${id}`)
      .expect(200);

    expect(confirmRes.body.title).toBe('crud task updated');

    await request(app.getHttpServer())
      .delete(`/tasks/${id}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/tasks/${id}`)
      .expect(404);
  });
});
