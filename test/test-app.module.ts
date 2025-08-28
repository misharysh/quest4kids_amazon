import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppModule } from 'src/app.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '1310',
      database: process.env.DB_DATABASE ?? 'questForKids',
      autoLoadEntities: true,
      synchronize: true,
      dropSchema: true,
      logging: false,
    }),
    AppModule,
  ],
  providers: [],
})
export class TestAppModule {}
