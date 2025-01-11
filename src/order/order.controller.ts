// order.controller.ts
import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-responce.dto copy';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order and initiate payment' })
  @ApiResponse({
    status: 201,
    description: 'Order successfully created and payment initiated',
    type: OrderResponseDto
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createOrder(@Req() req: any, @Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.orderService.createOrder(req.user.id, createOrderDto);
  }
}
