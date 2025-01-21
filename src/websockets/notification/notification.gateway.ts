import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtMiddleware } from '../middlewares/ws-jwt-middleware';

@WebSocketGateway({ cors: true })
export class NotificationGateway {
  @WebSocketServer()
  private server: Server;

  // Метод для отправки уведомления
  async sendNotificationToClients(
    recipientUserIds: number[], // Массив userId, которым нужно отправить уведомления
    message: any, // Сообщение для отправки
  ) {
    const activeSockets = Array.from(this.server.sockets.sockets.values());
    const activeSessions = activeSockets.map((socket: Socket) => ({
      socketId: socket?.id,
      userId: socket?.data?.user?.id,
    }));

    // Фильтруем активные сессии по userId
    const recipientSessions = activeSessions.filter((session) =>
      recipientUserIds.includes(session.userId),
    );

    // Отправляем уведомления соответствующим сокетам
    for (const session of recipientSessions) {
      this.server.to(session.socketId).emit('notification', message);
    }
  }

  
}
