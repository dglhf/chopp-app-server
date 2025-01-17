import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from './order.model';
import { CreateOrderDto } from './dto/create-order.dto';
import { ORDER_STATUS, PAYMENT_STATUS } from 'src/shared/enums';
import { CreatePaymentResponseDto } from '../payment/dto/create-payment-response.dto';
import { ShoppingCartItem } from 'src/shopping-cart/shopping-cart-item.model';
import { Op } from 'sequelize';
import { PaymentsService } from 'src/payment/payments.service';
import { ShoppingCart } from 'src/shopping-cart/shopping-cart.model';
import { OrderItem } from './order-item.model';
import { Product } from 'src/products/product.model';
import { PaginationResponse } from 'src/shared/types/pagination-response';
import { PaginationQuery } from 'src/shared/types';
import { Category } from 'src/categories/category.model';
import { FileModel } from 'src/files/file.model';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order) private orderModel: typeof Order,
    @InjectModel(OrderItem) private orderItemModel: typeof OrderItem,
    @InjectModel(ShoppingCart) private shoppingCartModel: typeof ShoppingCart,
    private paymentService: PaymentsService,
  ) {}

  async createOrder(userId: number): Promise<CreatePaymentResponseDto> {
    const transaction = await this.orderModel.sequelize.transaction();

    try {
      // Получение корзины пользователя
      const cart = await this.shoppingCartModel.findOne({
        where: { userId },
        include: [{ model: ShoppingCartItem, include: [{ model: Product }] }],
        transaction,
      });

      if (!cart || !cart.items.length) {
        throw new NotFoundException('Корзина пуста или не найдена.');
      }

      // Создание заказа
      const order = await this.orderModel.create(
        {
          userId,
          totalPrice: cart.totalPrice,
          quantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
          orderStatus: 'awaiting_payment', // Новый статус
          paymentStatus: 'pending',
        },
        { transaction },
      );

      // Создание позиций заказа
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

      // Вызов метода создания платежа
      const paymentResult = await this.paymentService.createPayment({
        amount: order.totalPrice.toString(),
        currency: 'RUB',
        description: `Оплата за заказ ${order.id}`,
        returnUrl: `${process.env.FRONTEND_URL}/order-confirmation/${order.id}`,
        metadata: { order_id: order.id },
      });

      // Обновление заказа после создания платежа
      order.transactionId = paymentResult.id;
      order.paymentStatus = 'pending';
      order.paymentUrl = paymentResult.confirmation.confirmation_url;
      await order.save({ transaction });

      await transaction.commit();

      // Получение полной информации о заказе
      const fullOrder = await this.orderModel.findOne({
        where: { id: order.id },
        include: [
          {
            model: OrderItem,
            include: [
              {
                model: Product,
                include: [
                  { model: FileModel, as: 'images' },
                  { model: Category },
                ],
              },
            ],
          },
        ],
      });

      if (!fullOrder) {
        throw new NotFoundException(`Заказ с ID ${order.id} не найден.`);
      }

      return fullOrder.toJSON() as CreatePaymentResponseDto;
    } catch (error) {
      await transaction.rollback();
      throw new NotFoundException(
        `Ошибка при создании заказа или инициации платежа: ${String(error)}`,
      );
    }
  }

  async findAllOrders({
    page = 1,
    limit = 10,
    search,
    sort = 'createdAt',
    order = 'ASC',
  }: PaginationQuery): Promise<PaginationResponse<Order>> {
    const offset = (page - 1) * limit;

    // Условие для поиска
    const whereCondition = search
      ? {
          [Op.or]: [
            { title: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    // Запрос с полным включением связанных данных
    const { rows: orders, count: totalItems } =
      await this.orderModel.findAndCountAll({
        where: whereCondition,
        limit,
        offset,
        order: [[sort, order]],
        include: [
          {
            model: OrderItem,
            include: [
              {
                model: Product,
                include: [
                  { model: FileModel, as: 'images' },
                  { model: Category },
                ],
              },
            ],
          },
        ],
      });

    return {
      items: orders,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      limit,
    };
  }

  async findOneOrder(id: number): Promise<Order> {
    const order = await this.orderModel.findOne({
      where: { id },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              include: [
                { model: FileModel, as: 'images' },
                { model: Category },
              ],
            },
          ],
        },
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found.`);
    }

    return order;
  }
}
