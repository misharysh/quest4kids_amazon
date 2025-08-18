import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './message.entity';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MessageGateway } from './message.gateway';
import { NotificationGateway } from '../notifications/notification.gateway';
import { OnlineService } from '../users/online/online.service';
import { UsersModule } from '../users/users.module';
import { CqrsModule } from '@nestjs/cqrs';
import { GetMessagesHandler } from './cqrs/handlers/get-messages.handler';

@Module({
  imports: [TypeOrmModule.forFeature([Message]), UsersModule, CqrsModule],
  controllers: [MessageController],
  providers: [
    MessageService,
    MessageGateway,
    NotificationGateway,
    OnlineService,
    GetMessagesHandler,
  ],
})
export class MessageModule {}
