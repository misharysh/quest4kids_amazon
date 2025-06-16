import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { NotificationGateway } from './notification.gateway';
import { FindNotificationParams } from './dto/find-notification.params';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  public async createForUser(
    userId: string,
    message: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      message,
      isRead: false,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    const fullNotification = await this.notificationRepository.findOne({
      where: { id: savedNotification.id },
      relations: ['user'],
    });

    if (!fullNotification) {
      throw new Error('Notification not found after save');
    }

    this.notificationGateway.sendNotification(userId, fullNotification);

    return savedNotification;
  }

  public async getUserNotifications(
    userId: string,
    filters: FindNotificationParams,
  ): Promise<Notification[]> {
    const where: any = { userId };

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  public async getUserNotificationCount(
    userId: string,
    filters: FindNotificationParams,
  ): Promise<number> {
    const query = await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (filters.isRead !== undefined) {
      query.andWhere('notification.isRead =:isRead', {
        isRead: filters.isRead,
      });
    }

    return query.getCount();
  }

  public async markAsRead(id: string): Promise<void> {
    await this.notificationRepository.update(id, { isRead: true });
  }

  public async delete(id: string): Promise<void> {
    await this.notificationRepository.delete(id);
  }
}
