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
import { PaymentService } from 'src/payment/payment.service';
import { GetPaymentsResponseDto } from './dto/get-payments-response.dto';
import { GetPaymentResponseDto } from './dto/get-payment-response.dto';
import { CapturePaymentDto } from './dto/capture-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { GetRefundResponseDto } from './dto/get-refund-response.dto';
import { GetRefundsResponseDto } from './dto/get-refunds-response.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
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
    return this.orderService.createOrder(req.user.id, createOrderDto);
  }

  @Get('/payments')
  @ApiOperation({ summary: 'Получить список платежей' })
  @ApiResponse({
    status: 200,
    description: 'Список платежей успешно получен',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Ограничение количества возвращаемых платежей',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Курсор для пагинации',
  })
  @ApiQuery({
    name: 'created_at_gte',
    required: false,
    type: String,
    description: 'Фильтр по времени создания: больше или равно',
  })
  @ApiQuery({
    name: 'created_at_gt',
    required: false,
    type: String,
    description: 'Фильтр по времени создания: строго больше',
  })
  @ApiQuery({
    name: 'created_at_lte',
    required: false,
    type: String,
    description: 'Фильтр по времени создания: меньше или равно',
  })
  @ApiQuery({
    name: 'created_at_lt',
    required: false,
    type: String,
    description: 'Фильтр по времени создания: строго меньше',
  })
  @ApiQuery({
    name: 'payment_id',
    required: false,
    type: String,
    description: 'Фильтр по идентификатору платежа',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Фильтр по статусу платежа',
  })
  async getPayments(
    @Query()
    queryParams: {
      limit?: number;
      cursor?: string;
      created_at_gte?: string;
      created_at_gt?: string;
      created_at_lte?: string;
      created_at_lt?: string;
      payment_id?: string;
      status?: string;
    },
  ): Promise<any> {
    return this.paymentService.getPayments(queryParams);
  }

  @Get('/:paymentId')
  @ApiOperation({
    summary: 'Получить подробную информацию о конкретном платеже',
  })
  @ApiResponse({
    status: 200,
    description: 'Подробная информация о платеже успешно получена',
    type: GetPaymentResponseDto,
  })
  async getPayment(
    @Param('paymentId') paymentId: string,
  ): Promise<GetPaymentResponseDto> {
    const paymentDetails = await this.paymentService.getPaymentById(paymentId);
    return { payment: paymentDetails }; // Оберните результат в объект для соответствия DTO
  }

  @Post('/:paymentId/capture')
  @ApiOperation({ summary: 'Подтвердить платеж' })
  @ApiResponse({ status: 200, description: 'Платеж успешно подтвержден' })
  async capturePayment(
    @Param('paymentId') paymentId: string,
    @Body() captureDto: CapturePaymentDto,
  ) {
    return await this.paymentService.capturePayment(paymentId, captureDto);
  }

  @Post('/:paymentId/cancel')
  @ApiOperation({
    summary: 'Отменить платеж, находящийся в статусе waiting_for_capture',
  })
  @ApiResponse({
    status: 200,
    description: 'Платеж успешно отменен',
    type: 'any', // Указать конкретный тип, если необходимо
  })
  async cancelPayment(@Param('paymentId') paymentId: string) {
    return await this.paymentService.cancelPayment(paymentId);
  }

  @Post('/refund')
  @ApiOperation({ summary: 'Создание возврата' })
  @ApiResponse({
    status: 201,
    description: 'Возврат успешно создан',
    type: GetRefundResponseDto,
  })
  createRefund(
    @Body() createRefundDto: CreateRefundDto,
  ): Promise<GetRefundResponseDto> {
    return this.paymentService.createRefund(createRefundDto);
  }

  @Get('/refunds')
  @ApiOperation({ summary: 'Получение списка возвратов' })
  @ApiResponse({ status: 200, description: 'Список возвратов получен' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Ограничение количества возвращаемых возвратов',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Курсор для пагинации',
  })
  @ApiQuery({
    name: 'created_at_gte',
    required: false,
    type: String,
    description: 'Фильтр по времени создания: больше или равно',
  })
  @ApiQuery({
    name: 'created_at_gt',
    required: false,
    type: String,
    description: 'Фильтр по времени создания: строго больше',
  })
  @ApiQuery({
    name: 'created_at_lte',
    required: false,
    type: String,
    description: 'Фильтр по времени создания: меньше или равно',
  })
  @ApiQuery({
    name: 'created_at_lt',
    required: false,
    type: String,
    description: 'Фильтр по времени создания: строго меньше',
  })
  @ApiQuery({
    name: 'payment_id',
    required: false,
    type: String,
    description: 'Фильтр по идентификатору платежа',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Фильтр по статусу возврата',
  })
  async getRefunds(
    @Query()
    queryParams: {
      limit?: number;
      cursor?: string;
      created_at_gte?: string;
      created_at_gt?: string;
      created_at_lte?: string;
      created_at_lt?: string;
      payment_id?: string;
      status?: string;
    },
  ): Promise<any> {
    return this.paymentService.getRefunds(queryParams);
  }

  @Get('/refund/:refundId')
  @ApiOperation({ summary: 'Получение информации о возврате' })
  @ApiResponse({
    status: 200,
    description: 'Информация о возврате',
    type: GetRefundResponseDto,
  })
  getRefundById(
    @Param('refundId') refundId: string,
  ): Promise<GetRefundResponseDto> {
    return this.paymentService.getRefundById(refundId);
  }
}
