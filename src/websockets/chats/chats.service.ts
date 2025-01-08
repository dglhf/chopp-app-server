import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/users/users.model';
import { Chat } from './chats.model';
import { UsersService } from 'src/users/users.service';
import { RolesService } from 'src/roles/roles.service';
import { Message } from './messages.model';
import { MessagesService } from './messages.service';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat)
    private chatRepository: typeof Chat,
    private usersService: UsersService,
    private messagesService: MessagesService,
  ) {}

  // Getting chat history
  async getChatHistory(chatId: number) {
    return await this.chatRepository.findOne({
      where: { id: chatId },
      include: [{ model: User, attributes: { exclude: ['password'] } }],
    });
  }

  /*  
      usually, user, which not creator of chat,
      but who can join to chat - is admin,
      but for future extending name of method is joinUserToChat
  */
  async joinUserToChat(chatId, userId) {
    const chat = await this.chatRepository.findByPk(chatId);
    const user = await this.usersService.getUserByFieldName(userId, 'id');

    if (chat && user) {
      await chat.$add('users', user);
      console.log('!!!!!!-----: Пользователь добавлен в чат');
    } else {
      console.log('!!!!!!-----:  Чат или пользователь не найдены');
    }
  }

  async handleMessage(message: Message, userId: number) {
    const user = await this.usersService.getUserByFieldName(userId, 'id');

    if (!user) {
      throw new Error('User not found.');
    }

    const isNotAdmin = user.roles.some((role) => role.value === 'USER');

    /* 
      "User" role has only 1 chat, "Admin" - several, handler of 3 options:
      1. User is not admin, but sent the message and need create new chat.
      2. Chat already exist and need add message to user's chat if "User" role.
      3. If "Admin" sent the message, that's mean, that chat is already exist
      and need find the chat and add the message.
    */

    if (!user.chats.length && isNotAdmin) {
      // in createMessage will created message with sender id
      const newMessage = await this.messagesService.createMessage(message, userId);
      // in createChat will created chat with ownerId and connected with user
      const newChat = await this.createChat(user);

      newMessage.$set('chatId', newChat.id);
      newChat.$add('messages', newMessage);
    } else if (user.chats.length && isNotAdmin) {
      const userChatId = user.chats[0].id;
      const userChat = await this.chatRepository.findByPk(userChatId);

      const newMessage = await this.messagesService.createMessage(message, userId);

      newMessage.$set('chatId', userChat.id);
      userChat.$add('messages', newMessage);
    } else {
      /* 
        todo: need handler for adding message to chat from admin,
        because admin has a lot of chats, need additional sign of current chat in message meta
      */
    }
  }

  async createChat(user: User) {
    const newChat = await this.chatRepository.create({ ownerId: user.id });

    await newChat.$set('users', [user]);

    return newChat;
  }

  async sendMessage(chatId: number, userId: number, message: string) {
    const chat = await this.chatRepository.findOne({
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

  async getAllChats() {
    return await this.chatRepository.findAll({ include: 'all' });
  }
}
