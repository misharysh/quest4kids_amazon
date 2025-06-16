import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { TasksModule } from '../tasks/tasks.module';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { MessageGateway } from '../messages/message.gateway';
import { MessageService } from '../messages/message.service';
import { Message } from '../messages/message.entity';
import { OnlineService } from '../users/online/online.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Message]),
    forwardRef(() => TasksModule),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationGateway,
    NotificationService,
    MessageGateway,
    MessageService,
    OnlineService,
  ],
  exports: [NotificationService, MessageService, OnlineService],
})
export class NotificationModule {}
