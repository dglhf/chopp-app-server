import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { BaseGateway } from '../gateways/base.gateway';
import { WsJwtMiddleware } from '../middlewares/ws-jwt-middleware';
import { ActiveSessionService } from '../active-sessions/active-session.service';

@WebSocketGateway({ cors: true })
export class NotificationGateway extends BaseGateway {
  constructor(
    jwtMiddleware: WsJwtMiddleware,
    activeSessionService: ActiveSessionService,
  ) {
    super(jwtMiddleware, activeSessionService);
  }

  @SubscribeMessage('notification')
  handleNotification(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    console.log(`Notification from user ${user.id}:`, data);
    client.emit('notification', { message: 'Notification processed' });
  }
}
