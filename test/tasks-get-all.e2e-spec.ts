import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import { User } from "../src/users/user.entity";
import { Task } from "../src/tasks/task.entity";
import { Test } from "@nestjs/testing";
import { TestAppModule } from "./test-app.module";
import { StatisticsService } from "../src/statistics/statistics.service";
import { Role } from "../src/users/role.enum";
import { TaskStatus } from "../src/tasks/task.model";
import * as request from 'supertest';
import { DatabaseLoggingService } from "../src/logging/loggers/database-logging.service";
import { NoopLoggingService } from "./utils/noop-logging.service";
import * as bcrypt from 'bcrypt';
import { RefreshToken } from "../src/users/refresh-token.entity";
import { TelegramService } from "../src/telegram/telegram.service";

describe('TasksController - getAll', () => {
    let app: INestApplication;
    let dataSource: DataSource;

    let parent: User;
    let child: User;
    let task1: Task;
    let task2: Task;

    let parentToken: string;
    let childToken: string;

    beforeAll(async () => {
        
        const moduleRef = await Test.createTestingModule({
            imports: [TestAppModule],
        })
        .overrideProvider(StatisticsService)
        .useValue({
            ping: jest.fn().mockResolvedValue('pong'),
            getLatestReport: jest.fn().mockResolvedValue({}),
        })
        .overrideProvider(DatabaseLoggingService)
        .useClass(NoopLoggingService)
        .overrideProvider(TelegramService)
        .useValue({
            onModuleDestroy: jest.fn(),
        })
        .compile();

        app = moduleRef.createNestApplication();
        await app.init();

        dataSource = moduleRef.get(DataSource);

        //Preparing test data
        const userRepository = dataSource.getRepository(User);
        const taskRepository = dataSource.getRepository(Task);
        

        const parentHashedPassword = await bcrypt.hash('Test123!!', 10);
        //Create data
        parent = await userRepository.save(
            userRepository.create({
            name: 'Parent Test',
            email: 'parent@test.com',
            password: parentHashedPassword,
            role: Role.PARENT
            })
        );

        const childHashedPassword = await bcrypt.hash('Test123!!', 10);
        child = await userRepository.save(
            userRepository.create({
            name: 'Child Test',
            email: 'child@test.com',
            password: childHashedPassword,
            role: Role.CHILD,
            parentId: parent.id,
            })
        );

        const parentLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({email: parent.email, password: 'Test123!!'})
            .expect(201);

        const childLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({email: child.email, password: 'Test123!!'})
            .expect(201);

        parentToken = parentLogin.body.accessToken;
        childToken = childLogin.body.accessToken;

        if (!parentToken) throw new Error('Parent token not received');
        if (!childToken) throw new Error('Child token not received');

        task1 = taskRepository.create({
            title: 'Math Homework',
            description: 'Do exercises',
            status: TaskStatus.OPEN,
            userId: child.id,
        });

        await taskRepository.save(task1);

        task2 = taskRepository.create({
            title: 'Clean Room',
            description: 'Before dinner',
            status: TaskStatus.DONE,
            userId: child.id,
        });

        await taskRepository.save(task2);
    });

    afterAll(async () => {
        const userRepo = dataSource.getRepository(User);
        const taskRepo = dataSource.getRepository(Task);
        const refreshRepo = dataSource.getRepository(RefreshToken);

        if (task1?.id) await taskRepo.delete(task1.id);
        if (task2?.id) await taskRepo.delete(task2.id);

        if (child?.id)
        {
            await refreshRepo.delete({ user: { id: child.id } });
            await userRepo.delete(child.id);
        }

        if (parent?.id)
        {
            await refreshRepo.delete({ user: { id: parent.id } })
            await userRepo.delete(parent.id);
        } 

        await app.close();
    });

    it('Parent should receive all tasks from all children', async () => {
        const res = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${parentToken}`)
        .query({}) // without filters
        .expect(200);

        expect(res.body.data.length).toBe(2);
        expect(res.body.data.map((t) => t.title)).toEqual(
        expect.arrayContaining(['Math Homework', 'Clean Room'])
        );
    });

    it('Parent should filter tasks by status', async () => {
        const res = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${parentToken}`)
        .query({ status: TaskStatus.DONE })
        .expect(200);

        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].status).toBe(TaskStatus.DONE);
    });

    it('Parent should filter tasks by specific child', async () => {
        const res = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${parentToken}`)
        .query({ childId: child.id })
        .expect(200);

        expect(res.body.data.every((t) => t.userId === child.id)).toBe(true);
    });


    it('Child should receive only own tasks', async () => {
        const res = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${childToken}`)
        .query({})
        .expect(200);

        expect(res.body.data.length).toBe(2);
        expect(res.body.data.every((t) => t.userId === child.id)).toBe(true);
    });
});