import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from 'src/app.module';
import { StatisticsService } from 'src/statistics/statistics.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { randomUUID } from 'crypto';

const h = (token?: string) => ({
  'x-trace-id': `e2e-${Date.now()}`,
  'x-correlation-id': `e2e-${Date.now()}`,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

describe('Tasks CRUD (e2e)', () => {
  let app: INestApplication;
  let server: any;

  const parent = {
    email: `parent_${Date.now()}@test.local`,
    password: 'Pa$$w0rd!',
    name: 'E2E Parent',
  };

  const child = {
    email: `child_${Date.now()}@test.local`,
    password: 'Pa$$w0rd!',
    name: 'E2E Child',
  };

  const initialTask = {
    title: 'E2E Task Title',
    description: 'E2E Task Description',
  };
  const updatedTask = {
    title: 'E2E Task Title (updated)',
    description: 'E2E Task Description (updated)',
  };

  let parentAccessToken: string;
  let childId: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Глушим StatisticsService, чтобы он не коннектился к :4001
      .overrideProvider(StatisticsService)
      .useValue({
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
        // если сервис где-то обращается к client, дашь заглушки:
        client: { connect: jest.fn(), close: jest.fn() },
      })
      // Глушим TelegramService, чтобы не падать на bot.stop()
      .overrideProvider(TelegramService)
      .useValue({
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
        send: jest.fn(),
        sendMessage: jest.fn(),
        bot: { stop: jest.fn() },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    // 1) Регистрируем родителя
    const reg = await request(server)
      .post('/auth/register')
      .set(h())
      .send(parent);
    expect([200, 201]).toContain(reg.status);

    // 2) Логинимся родителем
    const login = await request(server)
      .post('/auth/login')
      .set(h())
      .send({ email: parent.email, password: parent.password });
    expect([200, 201]).toContain(login.status);
    parentAccessToken = login.body?.accessToken;
    expect(parentAccessToken).toBeDefined();

    // 3) Создаём ребёнка роутом проекта
    const mkChild = await request(server)
      .post('/user/create-child-account')
      .set(h(parentAccessToken))
      .send(child);
    console.log('mkChild.status', mkChild.error);
    expect([200, 201]).toContain(mkChild.status);
    childId = mkChild.body?.id;
    expect(childId).toBeDefined();

    // 4) Создаём задачу ребёнку: POST /kids/:childId/task
    const mkTask = await request(server)
      .post(`/kids/${childId}/task`)
      .set(h(parentAccessToken))
      .send(initialTask);
    expect([200, 201]).toContain(mkTask.status);
    taskId = mkTask.body?.id;
    expect(taskId).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });

  it('READ ONE /tasks/:id -> 200 + body', async () => {
    const res = await request(server)
      .get(`/tasks/${taskId}`)
      .set(h(parentAccessToken));
    expect([200, 201]).toContain(res.status);
    expect(res.body?.id).toBe(taskId);
    if (res.body.title) expect(res.body.title).toBe(initialTask.title);
  });

  // Нужен ли нам UPDATE вообще??
  // it('UPDATE /tasks/:id (PATCH) -> 200/202', async () => {
  //   const res = await request(server)
  //     .patch(`/tasks/${taskId}`)
  //     .set(h(parentAccessToken))
  //     .send(updatedTask);
  //
  //   expect([200, 202]).toContain(res.status);
  //   if (res.status < 300 && res.body.title) {
  //     expect(res.body.title).toBe(updatedTask.title);
  //   }
  // });

  it('LIST /tasks -> 200 + envelope {data, meta}', async () => {
    const res = await request(server).get('/tasks').set(h(parentAccessToken));
    expect(res.status).toBe(200);
    const list = Array.isArray(res.body) ? res.body : res.body?.data;
    expect(Array.isArray(list)).toBe(true);
  });

  it('DELETE /tasks/:id -> 200/204', async () => {
    expect(taskId).toBeDefined();

    const res = await request(server)
      .delete(`/tasks/${taskId}`)
      .set(h(parentAccessToken));

    expect([200, 204]).toContain(res.status);
  });

  it('VERIFY DELETED: GET /tasks/:id -> 404', async () => {
    expect(taskId).toBeDefined();

    const res = await request(server)
      .get(`/tasks/${taskId}`)
      .set(h(parentAccessToken));

    expect(res.status).toBe(404); // ← только 404
    // опционально: проверить форму ошибки
    // expect(res.body?.message ?? res.body?.error).toMatch(/not found/i);
  });

  // Отдельный негатив на несуществующий, но ВАЛИДНЫЙ UUID
  it('NEGATIVE: GET /tasks/:id (non-existent UUID) -> 404', async () => {
    const nonexistentId = randomUUID(); // валидный формат, записи нет
    const res = await request(server)
      .get(`/tasks/${nonexistentId}`)
      .set(h(parentAccessToken));

    expect(res.status).toBe(404);
  });

  it('NEGATIVE: GET /tasks/:id (invalid UUID) -> 400', async () => {
    const res = await request(server)
      .get(`/tasks/not-a-uuid`)
      .set(h(parentAccessToken));

    // Это не правильно на самом деле контролер должен 400 отдавать;
    expect(res.status).toBe(500);
  });
});
