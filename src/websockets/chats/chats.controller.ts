import { Body, Controller, Get, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { Chat } from './chats.model';
import { CreateChatDto } from './dto/create-chat.to';
import { UsersService } from 'src/users/users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('chats')
@Controller('chats')
export class ChatsController {
  constructor(
    private chatsService: ChatsService,
    private usersService: UsersService,
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

  @ApiOperation({ summary: 'Getting role by role value path param' })
  @ApiResponse({ status: 200, type: [Chat] })
  @Get()
  getAll() {
    return this.chatsService.getAllChats();
  }
}
