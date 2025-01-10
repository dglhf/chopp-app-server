import { Body, Controller, Get, Post, UnauthorizedException, UseGuards, Headers, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { Chat } from './chats.model';
import { CreateChatDto } from './dto/create-chat.to';
import { UsersService } from 'src/users/users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthService } from 'src/auth/auth.service';
import { MessagesService } from './messages.service';

@ApiTags('chats')
@Controller('chats')
export class ChatsController {
  constructor(
    private chatsService: ChatsService,
    private authService: AuthService,
    private usersService: UsersService,
    private messageService: MessagesService,
) {}

  @ApiOperation({ summary: 'Role creation' })
  @ApiResponse({ status: 200, type: Chat })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createChatDto: CreateChatDto) {
    const user = await this.usersService.getUserByFieldName(createChatDto.ownerId, 'id');
    if (!user) {
      throw new UnauthorizedException({ message: 'Invalid user' });
    }

    const newChat = await this.chatsService.createChat(user);
    this.chatsService.joinUserToChat(newChat.id, createChatDto.userId);

    return newChat;
  }

  @ApiOperation({ summary: 'Getting all chats by user id from accessToken in auth header' })
  @ApiResponse({ status: 200, type: [Chat] })
  @UseGuards(JwtAuthGuard)
  @Get()
  getAllChats(@Headers() headers) {
    const authHeader = headers.authorization;
    const accessToken = authHeader.split(' ')[1];

    const payload = this.authService.verifyToken(
      accessToken,
      process.env.JWT_ACCESS_SECRET_HEX,
    );

    return this.chatsService.getAllChats(payload.id);
  }

  @ApiOperation({ summary: 'Getting chat messages by chat id param' })
  @ApiResponse({ status: 200, type: [Chat] })
  @UseGuards(JwtAuthGuard)
  @Get('/:id/messages')
  getAllChatMessages(@Param() params) {
    const { id } = params;
    return this.messageService.getAllChatMessages(id);
  }
}
