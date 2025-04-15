import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "./notification.entity";
import { TasksModule } from "src/tasks/tasks.module";
import { NotificationController } from "./notification.controller";
import { NotificationGateway } from "./notification.gateway";
import { NotificationService } from "./notification.service";

@Module({
    imports: [TypeOrmModule.forFeature([Notification]), forwardRef(() => TasksModule)],
    controllers: [NotificationController],
    providers: [NotificationGateway, NotificationService],
    exports: [NotificationService]
})
export class NotificationModule {}