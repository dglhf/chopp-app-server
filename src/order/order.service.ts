import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from './order.model';
import { CreateOrderDto } from './dto/create-order.dto';
import { ORDER_STATUS, PAYMENT_STATUS } from 'src/shared/enums';
import { PaymentService } from 'src/payment/payment.service';
import { CreateOrderResponseDto } from './dto/create-order-response.dto copy';
import { ShoppingCartItem } from 'src/shopping-cart/shopping-cart-item.model';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order) private orderModel: typeof Order,
    private paymentService: PaymentService,
    @InjectModel(ShoppingCartItem) private shoppingCartItemModel: typeof ShoppingCartItem, // Убедитесь, что модель инжектирована
  ) {}

  async createOrder(
    userId: number,
    createOrderDto: CreateOrderDto,
  ): Promise<CreateOrderResponseDto> {
    const transaction = await this.orderModel.sequelize.transaction();

    try {
      // Создание заказа без элементов
      const order = await this.orderModel.create({
        userId,
        totalPrice: createOrderDto.totalPrice,
        quantity: createOrderDto.quantity,
        orderStatus: ORDER_STATUS.PENDING,
        paymentStatus: PAYMENT_STATUS.PENDING,
      }, { transaction });

      // Добавление элементов заказа
      await Promise.all(createOrderDto.items.map(itemDto =>
        this.shoppingCartItemModel.create({
          productId: itemDto.productId,
          quantity: itemDto.quantity,
          orderId: order.id, // Привязка к созданному заказу
        }, { transaction })
      ));

      // Создание платежа
      const paymentResult = await this.paymentService.createPayment({
        amount: order.totalPrice.toString(),
        returnUrl: createOrderDto.returnUrl,
        description: `Payment for order ${order.id}`,
      });

      // Обновление данных заказа
      order.transactionId = paymentResult.id;
      order.paymentStatus = PAYMENT_STATUS.PENDING;
      order.paymentUrl = paymentResult.confirmation.confirmation_url;
      await order.save({ transaction });

      await transaction.commit();

      return {
        id: order.id,
        totalPrice: order.totalPrice,
        quantity: order.quantity,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        transactionId: order.transactionId,
        paymentUrl: order.paymentUrl
      } as CreateOrderResponseDto;
    } catch (error) {
      await transaction.rollback();
      throw new NotFoundException(`Failed to create order or initiate payment. ${String(error)}`);
    }
  }
}
