import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Message } from './messages.model';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message)
    private messageRepository: typeof Message,
  ) {}

  async createMessage(message: Message, userId: number) {
    const { text = '' } = message;

    const newMessage = await this.messageRepository.create({ text });

    await newMessage.$set('senderId', userId);

    return newMessage;
  }

  async getAllChatMessages(chatId: number) {
    return await this.messageRepository.findAll({
      where: { chatId },
      include: { all: true },
    });
  }

  // async sendMessage(chatId: number, userId: number, message: string) {
  //   const chat = await this.messageRepository.findOne({
  //     where: { id: chatId },
  //     include: [{ model: User }],
  //   });

  //   if (!chat) {
  //     throw new Error('Chat not found.');
  //   }

  //   const user = chat.users.find((user) => user.id === userId);
  //   if (!user) {
  //     throw new Error('User is not a participant of this chat.');
  //   }

  //   return {
  //     message: 'Message sent successfully',
  //     chatId: chat.id,
  //     userId,
  //     content: message,
  //   };
  // }
}
