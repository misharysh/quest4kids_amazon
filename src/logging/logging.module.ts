import { Global, Module, Scope } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseLogEntity } from './database-logging.entity';
import { Repository } from 'typeorm';
import { ConsoleLoggingService } from './loggers/console-logging.service';
import { DatabaseLoggingService } from './loggers/database-logging.service';
import { LoggingFactory } from './logging.factory';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([DatabaseLogEntity])],
  providers: [ConsoleLoggingService, DatabaseLoggingService, LoggingFactory],
  // providers: [
  //     {
  //         provide: 'LoggingFactory',
  //         useClass: ConsoleLoggingFactory,
  //         //  useFactory: (repo: Repository<DatabaseLogEntity>) => new DatabaseLoggingFactory(repo),
  //         //  inject: [getRepositoryToken(DatabaseLogEntity)],
  //          scope: Scope.REQUEST
  //     },
  // ],
  exports: [LoggingFactory],
})
export class LoggingModule {}
