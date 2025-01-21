import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { WsJwtMiddleware } from '../middlewares/ws-jwt-middleware';
import { SequelizeModule } from '@nestjs/sequelize';
import { ActiveSession } from '../active-sessions/active-session.model';

@Module({
  imports: [
    // SequelizeModule.forFeature([ActiveSession]), // Для работы с моделью ActiveSession
  ],
  providers: [
    NotificationGateway, // Gateway для WebSocket
    NotificationService, // Сервис для работы с уведомлениями
    // ActiveSessionService, // Сервис для работы с активными сессиями
    WsJwtMiddleware, // Middleware для обработки JWT в WebSocket
  ],
  exports: [
    NotificationService, // Экспортируем NotificationService, чтобы использовать в других модулях
  ],
})
export class NotificationModule {}
