import { Controller, UseGuards, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OrderService } from './order.service';
import { PaymentsService } from 'src/payment/payments.service';
import { GetOrdersResponseDto } from './dto/get-orders-response.dto';
import { PaginationResponse } from 'src/shared/types/pagination-response';
import { Order } from './order.model';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of orders' })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Limit of orders per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
    description: 'Search by order details',
    example: '', // Пример зависит от того, какой тип поиска вы ожидаете (например, поиск по имени заказа)
  })
  @ApiQuery({
    name: 'sort',
    type: 'string',
    required: false,
    description: 'Sort key',
    example: 'createdAt', // Укажите здесь ваше значение по умолчанию для сортировки, если оно есть
  })
  @ApiQuery({
    name: 'order',
    type: 'string',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders successfully retrieved',
    type: [GetOrdersResponseDto],
  })
  async getAllOrders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('sort') sort: string = 'createdAt',
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<PaginationResponse<Order>> {
    return this.orderService.findAllOrders({
      page,
      limit,
      search,
      sort,
      order,
    });
  }
}
