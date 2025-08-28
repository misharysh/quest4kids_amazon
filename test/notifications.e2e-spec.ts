import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './utils/create-app';

describe('NotificationController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /notifications should return notifications list', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /notifications/:id/read should mark notification as read', async () => {
    const notificationId = '1';
    const res = await request(app.getHttpServer())
      .patch(`/notifications/${notificationId}/read`)
      .expect(200);

    expect(res.body).toHaveProperty('message', 'Notification marked as read.');
  });

  it('DELETE /notifications/:id should delete a notification', async () => {
    const notificationId = '1';
    await request(app.getHttpServer())
      .delete(`/notifications/${notificationId}`)
      .expect(200);
  });
});
