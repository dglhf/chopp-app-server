// order.controller.ts
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto copy';
import { PaymentsService } from 'src/payment/payments.service';
import { GetPaymentsResponseDto } from './dto/get-payments-response.dto';
import { GetPaymentResponseDto } from './dto/get-payment-response.dto';
import { CapturePaymentDto } from './dto/capture-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { GetRefundResponseDto } from './dto/get-refund-response.dto';
import { GetRefundsResponseDto } from './dto/get-refunds-response.dto';
import { GetOrdersResponseDto } from './dto/get-orders-response.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый заказ и инициировать платеж' })
  @ApiResponse({
    status: 201,
    description: 'Заказ успешно создан, и платеж инициирован',
    type: CreateOrderResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  async createOrder(
    @Req() req: any,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<CreateOrderResponseDto> {
    return this.orderService.createOrder(req.user.id, createOrderDto.returnUrl);
  }

  // order.controller.ts

  @Get()
  @ApiOperation({ summary: 'Get list of orders' })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Limit of orders per page',
  })
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
    description: 'Search by order details',
  })
  @ApiQuery({
    name: 'sort',
    type: 'string',
    required: false,
    description: 'Sort key',
  })
  @ApiQuery({
    name: 'order',
    type: 'string',
    required: false,
    description: 'Sort order',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders successfully retrieved',
    type: [GetOrdersResponseDto],
  })
  async getAllOrders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string,
    @Query('sort') sort: string,
    @Query('order') order: string = 'ASC',
  ): Promise<any> {
    console.log('------getAllOrders!!!');
    return this.orderService.findAllOrders(page, limit, search, sort, order);
  }
}
