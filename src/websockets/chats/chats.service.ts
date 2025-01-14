import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/users/users.model';
import { Chat } from './chats.model';
import { UsersService } from 'src/users/users.service';
import { Message } from './messages.model';
import { MessagesService } from './messages.service';
import { ActiveSessionService } from '../active-sessions/active-session.service';
import { Sequelize } from 'sequelize';
import { Socket } from 'socket.io';
import { ActiveSocket } from 'src/shared/types';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat)
    private chatRepository: typeof Chat,
    private usersService: UsersService,
    private messagesService: MessagesService,
    private activeSessionService: ActiveSessionService,
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

  async handleMessage(socket: Socket, activeSessions: ActiveSocket[], message: Message, senderId: number) {
    const user = await this.usersService.getUserByFieldName(senderId, 'id');

    if (!user) {
      throw new Error('User not found.');
    }

    const isAdmin = user.roles.some((role) => role.value === 'ADMIN');

    /* 
      "User" role has only 1 chat, "Admin" - several, handler of 3 options:
      1. User is not admin, but sent the message and need create new chat.
      2. Chat already exist and need add message to user's chat if "User" role.
      3. If "Admin" sent the message, that's mean, that chat is already exist
      (because Admin can see the chat after User creating or he can create Chat without any messages)
      and need find the chat and add the message.
    */

    const isUserFirstMessage = !user.chats.length && !isAdmin;
    const isUserAddMessageToExistChat = user.chats.length && !isAdmin;
    const isAdminFirstMessageToExistChat = user.chats.length < 2 && isAdmin;
    const isAdminAddMessageToExistChat = user.chats.length >= 2 && isAdmin;

    if (isUserFirstMessage) {
      console.log('-------------isUserFirstMessage------------');
      // in createMessage will created message with sender id
      const newMessage = await this.messagesService.createMessage(message, senderId);
      // in createChat will created chat with ownerId and connected with user
      const newChat = await this.createChat(user);

      await newMessage.update({ chatId: newChat.id });
      await newChat.$add('messages', newMessage);

      // TODO: temporary descision, broadcast to all admins
      // need resolve case with 
      const admins = await this.usersService.getAdmins();

      const recipients = admins.map((admin) => admin.id);

      const activeRecipients = activeSessions
        .filter((session) => recipients.includes(session.userId))
        .map((session) => session.socketId);

      this.broadcastMessagesToChatUsers(activeRecipients, newMessage, socket);
    } else if (isUserAddMessageToExistChat) {
      console.log('-------------isUserAddMessageToExistChat------------');

      const userChatId = user.chats[0].id;
      const userChat = await this.chatRepository.findByPk(userChatId, {
        include: [
          {
            model: User, // Модель User
            // where: { id: specificUserId }, // здесь можно добавить исключение - senderId
            through: { attributes: [] }, // Исключаем атрибуты промежуточной таблицы UserChats, если они не нужны
          },
        ],
      });

      const newMessage = await this.messagesService.createMessage(message, senderId);

      await newMessage.update({ chatId: userChat.id });
      await userChat.$add('messages', newMessage);

      // recipients - users of current message's chat
      const recipients = userChat.users
        .filter((recipient) => recipient.id !== user.id)
        .map((recipient) => recipient.id);

      const activeRecipients = activeSessions
        .filter((session) => recipients.includes(session.userId))
        .map((session) => session.socketId);
      this.broadcastMessagesToChatUsers(activeRecipients, newMessage, socket);
    } else if (isAdminAddMessageToExistChat) {
      console.log('-------------isAdminAddMessageToExistChat------------', message);
      const userChat = await this.chatRepository.findByPk(message.chatId, {
        include: [
          {
            model: User, // Модель User
            // where: { id: specificUserId }, // could be exclude here by senderId
            // TODO: need resolve case with several roles before
            through: { attributes: [] }, // Could be exceptions here
          },
        ],
      });

      const newMessage = await this.messagesService.createMessage(message, senderId);

      await newMessage.update({ chatId: userChat.id });
      await userChat.$add('messages', newMessage);

      // recipients - users of current message's chat
      const recipients = userChat.users
        .filter((recipient) => recipient.id !== user.id)
        .map((recipient) => recipient.id);

      const activeRecipients = activeSessions
        .filter((session) => recipients.includes(session.userId))
        .map((session) => session.socketId);

      this.broadcastMessagesToChatUsers(activeRecipients, newMessage, socket);
    } else if (isAdminFirstMessageToExistChat) {
      console.log('-------------isAdminFirstMessageToExistChat------------', message);
      await this.joinUserToChat(message.chatId, senderId);

      const userChat = await this.chatRepository.findByPk(message.chatId, {
        include: [
          {
            model: User,
            // where: { id: specificUserId }, // could be exclude here by senderId
            // TODO: need resolve case with several roles before
            through: { attributes: [] }, // Could be exceptions here
          },
        ],
      });

      const newMessage = await this.messagesService.createMessage(message, senderId);

      await newMessage.update({ chatId: userChat.id });
      await userChat.$add('messages', newMessage);

      const recipients = userChat.users
        .filter((recipient) => recipient.id !== user.id)
        .map((recipient) => recipient.id);

      const activeRecipients = activeSessions
        .filter((session) => recipients.includes(session.userId))
        .map((session) => session.socketId);

      this.broadcastMessagesToChatUsers(activeRecipients, newMessage, socket);
    } else {
      console.log('--------- handle message unexpected case --------');
    }
  }

  async createChat(user: User) {
    const newChat = await this.chatRepository.create({ ownerId: user.id });

    await newChat.$set('users', [user]);

    return newChat;
  }

  // argument activeRecipients - sockets of users from chat.users exclude sender
  broadcastMessagesToChatUsers(activeRecipients: string[], message: Message, socket) {
    // const sessions = await this.activeSessionService.getSessionsByUserIds(userIds);

    if (!activeRecipients.length) {
      console.log('---------- no active sessions available ----------');
    }

    console.log('activeRecipients -======>:', activeRecipients);

    // need update broadcast
    activeRecipients.forEach((recipientSocketId) => {
      if (recipientSocketId) {
        socket.to(recipientSocketId).emit('message', {
          message,
          recipientSocketId,
        });
      }
    });
  }

  async getAllChats(currentUserId: number) {
    const chats = await this.chatRepository.findAll({
      include: [
        {
          association: 'users',
          attributes: ['id', 'fullName'],
          through: { // delete throught UserChats table result
            attributes: [],
          },
        },
        // TODO: delete it and use only for testing
        {
          association: 'messages',
          attributes: ['id', 'text', 'wasReadBy', 'senderId', 'chatId', 'createdAt'],
        },
      ],
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              SELECT "text"
              FROM "messages" AS "Message"
              INNER JOIN "chat_messages" AS "ChatMessages"
              ON "Message"."id" = "ChatMessages"."messageId"
              WHERE "ChatMessages"."chatId" = "Chat"."id"
              ORDER BY "Message"."createdAt" DESC
              LIMIT 1
            )`),
            'lastMessage',
          ],
        ],
      },
    });

    return chats.map((chat) => {
      const users = chat.users || [];
      const filteredUsers = users.filter((user: User) => user.id !== currentUserId);
      const fullNames = filteredUsers.map((user: User) => user.fullName);
      return {
        ...chat.toJSON(),
        fullName: fullNames.join(', '),
      };
    });
  }

  async getAllChatMessagesByUserId(userId) {
    return await this.chatRepository.findOne({
      include: [
        {
          model: User,
          through: { attributes: [] },
          where: { id: userId },
        },
      ],
    });
  }
}
