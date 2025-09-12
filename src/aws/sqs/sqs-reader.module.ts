import { Module } from '@nestjs/common';
import { SqsModule } from './sqs.module';
import { SqsReaderService } from './sqs-reader.service';
import { SqsConsumer } from './sqs.consumer';
import { CqrsModule } from '@nestjs/cqrs';
import { EventFactory } from '../../events/event-factory';
import { ArrivedUserCreatedHandler } from '../../events/arrived-user-created.handler';

@Module({
  imports: [SqsModule, CqrsModule],
  providers: [
    SqsReaderService,
    SqsConsumer,
    EventFactory,
    ArrivedUserCreatedHandler,
  ],
})
export class SqsReaderModule {}
