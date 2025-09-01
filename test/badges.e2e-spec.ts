import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './utils/create-app';
import { CreateBadgeDto } from '../src/badges/dto/create-badge.dto';
import { Badge } from '../src/badges/badge.entity';
import { TaskLabelEnum } from '../src/tasks/task-label.enum';
import { PaginationResponse } from '../src/common/pagination.response';

describe('BadgesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /badges should create a new badge', async () => {
    const dto: CreateBadgeDto = {
      name: 'First badge',
      requiredPoints: 0,
      label: TaskLabelEnum.ART,
    };

    const res = await request(app.getHttpServer())
      .post('/badges')
      .send(dto)
      .expect(201);

    const body: Badge = res.body as Badge;
    expect(body.id).toBeDefined();
    expect(body.name).toBe(dto.name);
  });

  it('GET /badges should return a paginated list of badges', async () => {
    const res = await request(app.getHttpServer())
      .get('/badges?offset=0&limit=10')
      .expect(200);

    const body: PaginationResponse<Badge> =
      res.body as PaginationResponse<Badge>;
    expect(Array.isArray(body.data)).toBe(true);
    expect(typeof body.meta.total).toBe('number');
  });
});
