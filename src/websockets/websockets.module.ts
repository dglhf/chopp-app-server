import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatsGateway } from './chats/chats.gateway';
import { WsJwtMiddleware } from './middlewares/ws-jwt-middleware';
import { NotificationGateway } from './notifications/notification.gateway';
import { SequelizeModule } from '@nestjs/sequelize';
import { ActiveSession } from './active-sessions/active-session.model';
// import { ScheduleModule } from '@nestjs/schedule';
import { ActiveSessionModule } from './active-sessions/active-session.module';

@Module({
  imports: [SequelizeModule.forFeature([ActiveSession]), ActiveSessionModule],
  providers: [ChatsGateway, NotificationGateway, WsJwtMiddleware, JwtService],
  exports: [WsJwtMiddleware],
})
export class WebsocketsModule {}