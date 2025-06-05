import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Queue } from 'bullmq';
import { redisConfig } from './config/bull.config';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const options = new DocumentBuilder()
    .setTitle('quest4kids API')
    .setVersion('1.0')
    .addServer('http://localhost:3000/', 'Local environment')
    .addServer('https://quest4kids-a7fd24f91954.herokuapp.com/', 'Production')
    .addTag('Your API Endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const taskStatisticsQueue = new Queue('task-statistics', redisConfig);

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(taskStatisticsQueue)],
    serverAdapter,
  });

  const bullBoardRouter = serverAdapter.getRouter();
  app.use('/admin/queues', bullBoardRouter);

  await app.listen(process.env.PORT ?? 3000);
  console.log('Bull Board UI → http://localhost:3000/admin/queues');
}
bootstrap();
