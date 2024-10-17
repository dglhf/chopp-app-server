import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/users/users.model';
import { Chat } from './chats.model';
import { UsersService } from 'src/users/users.service';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat)
    private chatModel: typeof Chat,
    private usersService: UsersService,
    private roleService: RolesService,
  ) {}

  // Getting chat history
  async getChatHistory(chatId: number) {
    return await this.chatModel.findOne({
      where: { id: chatId },
      include: [{ model: User, attributes: { exclude: ['password'] } }],
    });
  }

  async createChat(message: string, userId: number) {
    const user = await this.usersService.getUserById(userId);

    if (!user || !user.roles.some((role) => role.value === 'USER')) {
      throw new Error('User not found or connetcted to chat user exist.');
    }

    // find ADMIN role user for connecting to chat, need check, if this only one
    const admin = await this.roleService.getRoleByValue('ADMIN');

    if (!admin) {
      throw new Error('No admin available to assign to the chat.');
    }

    const newChat = await this.chatModel.create({ message });

    await newChat.$set('users', [userId, admin.id]);

    return newChat;
  }

  async sendMessage(chatId: number, userId: number, message: string) {
    const chat = await this.chatModel.findOne({
        where: { id: chatId },
        include: [{ model: User }],
      });
  
      if (!chat) {
        throw new Error('Chat not found.');
      }
  
      const user = chat.users.find((user) => user.id === userId);
      if (!user) {
        throw new Error('User is not a participant of this chat.');
      }

      return {
        message: 'Message sent successfully',
        chatId: chat.id,
        userId,
        content: message,
      };
  }
}
