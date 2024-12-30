import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChatService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { Chat } from './chats.model';
import { UserChats } from './user-chats.model';
import { RolesModule } from 'src/roles/roles.module';
import { UsersModule } from 'src/users/users.module';
import { User } from 'src/users/users.model';
import { ActiveSessionService } from '../active-sessions/active-session.service';
import { WsJwtMiddleware } from '../middlewares/ws-jwt-middleware';
import { ActiveSessionModule } from '../active-sessions/active-session.module';
import { WebsocketsModule } from '../websockets.module';

@Module({
  providers: [ChatsGateway, ChatService ],
  imports: [
    SequelizeModule.forFeature([User, Chat, UserChats]),
    RolesModule,
    UsersModule,
    ActiveSessionModule,
    WebsocketsModule
  ],
  exports: [ChatService],
})
export class ChatsModule {}
