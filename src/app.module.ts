import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './tasks/tasks.module';
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { appConfigSchema, ConfigTypes } from './config/config-types';
import { typeOrmConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './tasks/task.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, typeOrmConfig],
      validationSchema: appConfigSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigTypes>) => ({
        ...configService.get('database'),
        entities: [Task],
      }),
    }),
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { TasksModule } from './tasks/tasks.module';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { appConfig } from './config/app.config';
// import { appConfigSchema, ConfigTypes } from './config/config-types';
// import { typeOrmConfig } from './config/database.config';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Task } from './tasks/task.entity';

// @Module({
//   imports: [
//     ConfigModule.forRoot({
//       isGlobal: true,
//       load: [appConfig, typeOrmConfig],
//       validationSchema: appConfigSchema,
//       validationOptions: {
//         abortEarly: true
//       }
//     }),
//     TypeOrmModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: (configService: ConfigService<ConfigTypes>) => ({
//         ...configService.get('database'),
//         entities: [Task],
//       }),
//     }),
//     TasksModule,
//   ],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}

