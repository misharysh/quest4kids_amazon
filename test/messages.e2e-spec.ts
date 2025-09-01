import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './utils/create-app';
import { Message } from '../src/messages/message.entity';

describe('MessageController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /messages should return an array of messages', async () => {
    const res = await request(app.getHttpServer())
      .get('/messages?withUserId=1')
      .expect(200);

    const body: Message[] = res.body;
    expect(Array.isArray(body)).toBe(true);
  });
});
