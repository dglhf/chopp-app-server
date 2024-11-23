import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../users/users.model';
import { ChatService } from './chats.service';
import { ChatGateway } from './chats.gateway';
import { Chat } from './chats.model';
import { UserChats } from './user-chats.model';
import { RolesModule } from 'src/roles/roles.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [ChatGateway, ChatService],
  imports: [
    SequelizeModule.forFeature([User, Chat, UserChats]),
    RolesModule,
    UsersModule,
  ],
  exports: [ChatService],
})
export class ChatsModule {}
