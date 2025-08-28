import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './utils/create-app';
import { LoginResponse } from '../src/users/dto/login.response.dto';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  const email = `test_${Date.now()}@example.com`;
  const password = 'Test1234!';

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register should register a user', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, confirmPassword: password })
      .expect(201);
  });

  it('POST /auth/login should return accessToken', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const body: LoginResponse = res.body as LoginResponse;
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
  });

  it('POST /auth/login with wrong password should fail', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'WrongPass1!' })
      .expect(401);
  });

  it('POST /auth/refresh should return new accessToken', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const loginBody: LoginResponse = login.body as LoginResponse;
    const refreshToken = loginBody.refreshToken;

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    const body: LoginResponse = res.body as LoginResponse;
    expect(body.accessToken).toBeDefined();
  });

  it('POST /auth/forgot-password should succeed', async () => {
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email })
      .expect(201);
  });
});
