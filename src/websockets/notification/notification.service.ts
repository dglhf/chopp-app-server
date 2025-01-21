import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(private readonly notificationGateway: NotificationGateway) {}

  async sendUserNotifications() {
    const recipientUserIds = [1, 2, 3]; // Идентификаторы пользователей
    const message = {
      title: 'Уведомление',
      body: 'Это тестовое уведомление',
    };

    await this.notificationGateway.sendNotificationToClients(
      recipientUserIds,
      message,
    );
  }
}
