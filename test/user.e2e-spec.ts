import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './utils/create-app';
import { User } from '../src/users/user.entity';

describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /user/get-child-account/:id should return a user', async () => {
    const id = 1;
    const res = await request(app.getHttpServer())
      .get(`/user/get-child-account/${id}`)
      .expect(200);

    const body: User = res.body;
    expect(body).toBeDefined();
    expect(body.id).toBe(id);
  });

  it('GET /user/get-children-list should return a paginated list', async () => {
    const res = await request(app.getHttpServer())
      .get('/user/get-children-list?offset=0&limit=10')
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.meta.total).toBe('number');
  });
});
