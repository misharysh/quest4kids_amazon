import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestAppModule } from '../test-app.module';
import { Test } from '@nestjs/testing';

export async function createTestApp(): Promise<INestApplication> {
  console.log('Creating TestAppModule...');
  const moduleRef = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();

  console.log('Creating NestApplication...');
  const app = moduleRef.createNestApplication();

  console.log('Applying global pipes...');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  console.log('Initializing app...');
  await app.init();
  console.log('App initialized.');
  return app;
}
