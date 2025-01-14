import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from './order.model';
import { CreateOrderDto } from './dto/create-order.dto';
import { ORDER_STATUS, PAYMENT_STATUS } from 'src/shared/enums';
import { CreateOrderResponseDto } from './dto/create-order-response.dto copy';
import { ShoppingCartItem } from 'src/shopping-cart/shopping-cart-item.model';
import { Op } from 'sequelize';
import { PaymentsService } from 'src/payment/payments.service';
import { ShoppingCart } from 'src/shopping-cart/shopping-cart.model';
import { OrderItem } from './order-item.model';
import { Product } from 'src/products/product.model';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order) private orderModel: typeof Order,
    @InjectModel(OrderItem) private orderItemModel: typeof OrderItem,
    @InjectModel(ShoppingCart) private shoppingCartModel: typeof ShoppingCart,
    @InjectModel(ShoppingCartItem)
    private shoppingCartItemModel: typeof ShoppingCartItem,
    private paymentService: PaymentsService,
  ) {}

  async createOrder(
    userId: number,
    returnUrl: string,
  ): Promise<CreateOrderResponseDto> {
    const transaction = await this.orderModel.sequelize.transaction();

    try {
      const cart = await this.shoppingCartModel.findOne({
        where: { userId: userId },
        include: [{ model: ShoppingCartItem, include: [{ model: Product }] }],
        transaction: transaction,
      });

      if (!cart || !cart.items.length) {
        throw new NotFoundException('Корзина пуста или не найдена.');
      }

      const order = await this.orderModel.create(
        {
          userId,
          totalPrice: cart.totalPrice,
          quantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
          orderStatus: ORDER_STATUS.PENDING,
          paymentStatus: PAYMENT_STATUS.PENDING,
        },
        { transaction },
      );

      for (const item of cart.items) {
        await this.orderItemModel.create(
          {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          },
          { transaction },
        );
      }

      const paymentResult = await this.paymentService.createPayment({
        amount: order.totalPrice.toString(),
        returnUrl: returnUrl,
        description: `Оплата за заказ ${order.id}`,
      });

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
        paymentUrl: order.paymentUrl,
      } as CreateOrderResponseDto;
    } catch (error) {
      await transaction.rollback();
      throw new NotFoundException(
        `Ошибка при создании заказа или инициации платежа: ${String(error)}`,
      );
    }
  }

  async findAllOrders(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sort: string = 'createdAt',
    order: string = 'ASC',
  ) {
    const offset = (page - 1) * limit;
    const whereCondition = search
      ? {
          [Op.or]: [
            { title: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    console.log('---findAllOrders!');
    const { rows: orders, count: totalItems } =
      await this.orderModel.findAndCountAll({
        where: whereCondition,
        limit,
        offset,
        order: [[sort, order]],
      });

    console.log('orders: ', orders);

    return {
      items: orders,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    };
  }
}
