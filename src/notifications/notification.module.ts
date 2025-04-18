import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "./notification.entity";
import { TasksModule } from "src/tasks/tasks.module";
import { NotificationController } from "./notification.controller";
import { NotificationGateway } from "./notification.gateway";
import { NotificationService } from "./notification.service";
import { MessageGateway } from "src/messages/message.gateway";
import { MessageService } from "src/messages/message.service";
import { Message } from "src/messages/message.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Notification, Message]), forwardRef(() => TasksModule)],
    controllers: [NotificationController],
    providers: [NotificationGateway, NotificationService, MessageGateway, MessageService],
    exports: [NotificationService, MessageService]
})
export class NotificationModule {}