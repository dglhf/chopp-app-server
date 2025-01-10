import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/users/users.model';
import { Chat } from './chats.model';
import { UsersService } from 'src/users/users.service';
import { Message } from './messages.model';
import { MessagesService } from './messages.service';
import { ActiveSessionService } from '../active-sessions/active-session.service';
import { Sequelize } from 'sequelize';

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

  async handleMessage(message: Message, userId: number, chatId: number) {
    const user = await this.usersService.getUserByFieldName(userId, 'id');

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
    const isAdminAddMessageToExistChat = isAdmin;

    if (isUserFirstMessage) {
      // in createMessage will created message with sender id
      const newMessage = await this.messagesService.createMessage(message, userId);
      // in createChat will created chat with ownerId and connected with user
      const newChat = await this.createChat(user);

      newMessage.$set('chatId', newChat.id);
      newChat.$add('messages', newMessage);
    } else if (isUserAddMessageToExistChat) {
      const userChatId = user.chats[0].id;
      const userChat = await this.chatRepository.findByPk(userChatId);

      const newMessage = await this.messagesService.createMessage(message, userId);

      newMessage.$set('chatId', userChat.id);
      userChat.$add('messages', newMessage);

      // broadcast message to users
      const recipients = userChat.users.filter((recipient) => recipient.id !== user.id).map((recipient) => recipient.id);
      this.broadcastMessagesToChatUsers(recipients);
    } else if (isAdminAddMessageToExistChat) {
      const userChat = await this.chatRepository.findByPk(chatId);

      const newMessage = await this.messagesService.createMessage(message, userId);

      newMessage.$set('chatId', userChat.id);
      userChat.$add('messages', newMessage);
      
      // broadcast message to users
      const recipients = userChat.users
        .filter((recipient) => recipient.id !== user.id)
        .map((recipient) => recipient.id);
      this.broadcastMessagesToChatUsers(recipients);
    } else {
      console.log('--------- handle message unexpected case --------');
    }
  }

  async createChat(user: User) {
    const newChat = await this.chatRepository.create({ ownerId: user.id });

    await newChat.$set('users', [user]);

    return newChat;
  }

  // argument users - users exclude sender
  async broadcastMessagesToChatUsers(userIds: number[]) {
    const sessions = await this.activeSessionService.getSessionsByUserIds(userIds);

    if (!sessions.length) {
      console.log('---------- no active sessions available ----------');
    }

    const sids = sessions.map((session) => session.sid);

    // need update broadcast
    // sids.forEach((recipientSocketId) => {
    //   if (recipientSocketId) {
    //     socket.to(recipientSocketId).emit('broadcast_message', {
    //       senderId,
    //       message,
    //     });
    //   }
    // });
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
}
