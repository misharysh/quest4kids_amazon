import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './utils/create-app';
import { CreateTaskDto } from 'src/tasks/dto/create-task.dto';
import { UpdateTaskDto } from 'src/tasks/dto/update-task.dto';
import { Task } from 'src/tasks/task.entity';
import { TaskStatus } from '../src/tasks/task.model';
import { PaginationResponse } from '../src/common/pagination.response';

describe('TasksController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /tasks should create a new task', async () => {
    const dto: CreateTaskDto = {
      title: 'Integration task',
      description: 'demo',
      points: 5,
      status: TaskStatus.IN_PROGRESS,
      userId: '0',
      comment: 'comment 1',
    };

    const res = await request(app.getHttpServer())
      .post('/tasks')
      .send(dto)
      .expect(201);

    const body: Task = res.body as Task;
    expect(body.id).toBeDefined();
    expect(body.title).toBe(dto.title);
  });

  it('GET /tasks should return paginated list', async () => {
    const res = await request(app.getHttpServer()).get('/tasks').expect(200);

    const body: PaginationResponse<Task> = res.body as PaginationResponse<Task>;

    expect(Array.isArray(body.data)).toBe(true);
    expect(typeof body.meta.total).toBe('number');
  });

  it('PATCH /tasks/:id should update an existing task', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'Old title' } as CreateTaskDto)
      .expect(201);

    const createdBody: Task = created.body as Task;
    const id = createdBody.id;
    const dto: UpdateTaskDto = { title: 'New title' };

    const updated = await request(app.getHttpServer())
      .patch(`/tasks/${id}`)
      .send(dto)
      .expect(200);

    const body: Task = updated.body as Task;
    expect(body.title).toBe('New title');
  });

  it('DELETE /tasks/:id should remove a task', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'To delete' } as CreateTaskDto)
      .expect(201);

    const body: Task = created.body as Task;
    const id = body.id;

    await request(app.getHttpServer()).delete(`/tasks/${id}`).expect(200);
  });
});
