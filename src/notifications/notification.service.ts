import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "./notification.entity";
import { NotificationGateway } from "./notification.gateway";

@Injectable()
export class NotificationService
{
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        private readonly notificationGateway: NotificationGateway,
    ) {};

    public async createForUser(userId: string, message: string): Promise<Notification>
    {
        const notification = this.notificationRepository.create({
            userId,
            message,
            isRead: false
        });

        const savedNotification = await this.notificationRepository.save(notification);

        this.notificationGateway.sendNotification(userId, message);

        return savedNotification;
    };

    public async getUserNotifications(userId: string): Promise<Notification[]>
    {
        return this.notificationRepository.find({
            where: {userId},
            order: {createdAt: 'DESC'},
        });
    };

    public async getUnreadUserNotifications(userId: string): Promise<Notification[]>
    {
        return this.notificationRepository.find({
            where: {userId, isRead: false},
            order: {createdAt: 'DESC'},
        });
    };

    public async markAsRead(id: string): Promise<void>
    {
        await this.notificationRepository.update(id, {isRead: true});
    };

    public async delete(id: string): Promise<void>
    {
        await this.notificationRepository.delete(id);
    };
}