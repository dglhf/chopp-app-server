import {
  Controller,
  UseGuards,
  Get,
  Query,
  Param,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CapturePaymentDto } from 'src/order/dto/capture-payment.dto';
import { CreateRefundDto } from 'src/order/dto/create-refund.dto';
import { GetPaymentResponseDto } from 'src/order/dto/get-payment-response.dto';
import { GetRefundResponseDto } from 'src/order/dto/get-refund-response.dto';
import { OrderService } from 'src/order/order.service';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private readonly paymentService: PaymentsService,
  ) {}

  @Get('')
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
