// import { Injectable, HttpException, NotFoundException } from '@nestjs/common';
// import { HttpService } from '@nestjs/axios';
// import { randomBytes } from 'crypto';
// import { YOOKASSA_URL } from './constants';
// import { CreateRefundDto } from 'src/order/dto/create-refund.dto';
// import { GetRefundResponseDto } from 'src/order/dto/get-refund-response.dto';
// import { InjectModel } from '@nestjs/sequelize';
// import { Product } from 'src/products/product.model';
// import { CapturePaymentDto } from './dto/capture-payment.dto';
// import { Order } from 'src/order/order.model';
// import { OrderItem } from 'src/order/order-item.model';
// import { YooKassaWebhookService } from './yookassa-webhook.service';
// import { NotificationService } from 'src/websockets/notification/notification.service';
// import { WS_MESSAGE_TYPE } from 'src/shared/enums/';
// import { User } from 'src/users/users.model';

// @Injectable()
// export class PaymentsService {
//   constructor(
//     @InjectModel(Order) private orderModel: typeof Order,
//     private httpService: HttpService,
//     private subscriptionService: YooKassaWebhookService,
//     private notificationService: NotificationService,
//   ) {}

//   async createPayment({
//     amount,
//     currency,
//     description,
//     returnUrl,
//     metadata,
//     user,
//     items,
//   }: {
//     amount: string;
//     currency: string;
//     description: string;
//     returnUrl: string;
//     metadata: Record<string, any>;
//     user: User;
//     items: OrderItem[];
//   }): Promise<any> {
//     const shopId = process.env.YOOKASSA_SHOP_ID;
//     const secretKey = process.env.YOOKASSA_SECRET_KEY;
//     const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

//     const headers = {
//       Authorization: `Basic ${auth}`,
//       'Content-Type': 'application/json',
//       'Idempotence-Key': this.generateIdempotenceKey(),
//     };

//     const receipt = this.createReceipt({ items, user });

//     const body = {
//       amount: {
//         value: amount,
//         currency: currency,
//       },
//       payment_method_data: {
//         type: 'bank_card',
//       },
//       confirmation: {
//         type: 'redirect',
//         return_url: returnUrl,
//       },
//       capture: true,
//       description: description,
//       metadata: metadata,
//       receipt,
//     };

//     try {
//       await this.notificationService.sendNotificationToAdmin<typeof body>({
//         type: WS_MESSAGE_TYPE.NEW_PAYMENT,
//         payload: body,
//       });

//       const response = await this.httpService.post(`${YOOKASSA_URL}/payments`, body, { headers }).toPromise();
//       return response.data;
//     } catch (error) {
//       throw new NotFoundException(
//         `Failed to initiate payment. ${String(error?.response?.data?.description || error?.response?.data)}`,
//       );
//     }
//   }

//   async payForOrder(orderId: number): Promise<any> {
//     // Найти заказ по ID
//     const order = await this.orderModel.findOne({
//       where: { id: orderId },
//       include: [
//         {
//           model: OrderItem,
//           include: [
//             {
//               model: Product,
//             },
//           ],
//         },
//         {
//           model: User, // Включаем пользователя
//           attributes: ['id', 'email', 'phoneNumber'], // Указываем, какие поля включать
//         },
//       ],
//     });

//     if (!order) {
//       throw new NotFoundException(`Order with ID ${orderId} not found.`);
//     }

//     // Проверить статус заказа
//     if (order.paymentStatus !== 'pending') {
//       throw new Error(`Order with ID ${orderId} cannot be paid. Current payment status: ${order.paymentStatus}`);
//     }

//     // Создание платежа
//     const paymentResult = await this.createPayment({
//       amount: order.totalPrice.toString(),
//       currency: 'RUB',
//       description: `Оплата за заказ ${order.id}`,
//       returnUrl: `${process.env.FRONTEND_URL}/order-confirmation/${order.id}`,
//       metadata: { order_id: order.id },
//       user: order.user,
//       items: order.items,
//     });

//     // Обновление информации о платеже в заказе
//     order.transactionId = paymentResult.id;
//     order.paymentStatus = 'pending';
//     order.paymentUrl = paymentResult.confirmation.confirmation_url;
//     await order.save();

//     // Добавить подписку на вебхук
//     await this.subscriptionService.createSubscription({
//       transactionId: paymentResult.id,
//       orderId,
//       status: 'pending',
//     });

//     return {
//       id: order.id,
//       totalPrice: order.totalPrice,
//       quantity: order.quantity,
//       orderStatus: order.orderStatus,
//       paymentStatus: order.paymentStatus,
//       transactionId: order.transactionId,
//       paymentUrl: order.paymentUrl,
//     };
//   }

//   async getPayments(params: {
//     limit?: number;
//     cursor?: string;
//     created_at_gte?: string;
//     created_at_gt?: string;
//     created_at_lte?: string;
//     created_at_lt?: string;
//     payment_id?: string;
//     status?: string;
//   }): Promise<any> {
//     const url = `${YOOKASSA_URL}/payments`;
//     const auth = Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64');
//     const headers = {
//       Authorization: `Basic ${auth}`,
//       'Content-Type': 'application/json',
//     };

//     try {
//       const response = await this.httpService
//         .get(url, {
//           headers,
//           params, // Передача фильтров как параметров запроса
//         })
//         .toPromise();

//       return response.data;
//     } catch (error) {
//       throw new NotFoundException(
//         `Failed to retrieve payments. ${String(error.response?.data?.description || error.response?.data)}`,
//       );
//     }
//   }

//   async getPaymentById(paymentId: string): Promise<any> {
//     const shopId = process.env.YOOKASSA_SHOP_ID;
//     const secretKey = process.env.YOOKASSA_SECRET_KEY;
//     const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

//     try {
//       const response = await this.httpService
//         .get(`${YOOKASSA_URL}/payments/${paymentId}`, {
//           headers: {
//             Authorization: `Basic ${auth}`,
//             'Content-Type': 'application/json',
//           },
//         })
//         .toPromise();

//       return response.data;
//     } catch (error) {
//       throw new NotFoundException(`Payment with ID ${paymentId} not found. ${String(error.response.data)}`);
//     }
//   }

//   async capturePayment(paymentId: string, captureData?: CapturePaymentDto): Promise<any> {
//     //TODO: YOOKASSA_SHOP_ID хранить в базе для каждого конкретного заказчика
//     const shopId = process.env.YOOKASSA_SHOP_ID;
//     const secretKey = process.env.YOOKASSA_SECRET_KEY;
//     const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

//     try {
//       const response = await this.httpService
//         .post(`${YOOKASSA_URL}/payments/${paymentId}/capture`, captureData, {
//           headers: {
//             Authorization: `Basic ${auth}`,
//             'Content-Type': 'application/json',
//           },
//         })
//         .toPromise();

//       return response.data;
//     } catch (error) {
//       throw new NotFoundException(`Failed to capture payment: ${paymentId}. ${String(error.response.data)}`);
//     }
//   }

//   async cancelPayment(paymentId: string): Promise<any> {
//     //TODO: YOOKASSA_SHOP_ID хранить в базе для каждого конкретного заказчика
//     const shopId = process.env.YOOKASSA_SHOP_ID;
//     const secretKey = process.env.YOOKASSA_SECRET_KEY;
//     const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

//     try {
//       const response = await this.httpService
//         .post(
//           `${YOOKASSA_URL}/payments/${paymentId}/cancel`,
//           {},
//           {
//             headers: {
//               Authorization: `Basic ${auth}`,
//               'Content-Type': 'application/json',
//             },
//           },
//         )
//         .toPromise();

//       return response.data;
//     } catch (error) {
//       throw new NotFoundException(`Failed to cancel payment. ${String(error.response.data)}`);
//     }
//   }

//   async createRefund(refundData: CreateRefundDto): Promise<any> {
//     //TODO: YOOKASSA_SHOP_ID хранить в базе для каждого конкретного заказчика
//     const shopId = process.env.YOOKASSA_SHOP_ID;
//     const secretKey = process.env.YOOKASSA_SECRET_KEY;
//     const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

//     try {
//       const response = await this.httpService
//         .post(`${YOOKASSA_URL}/refunds`, refundData, {
//           headers: {
//             Authorization: `Basic ${auth}`,
//             'Content-Type': 'application/json',
//             //TODO: разобраться с ключом идемпотентности
//             'Idempotence-Key': this.generateIdempotenceKey(),
//           },
//         })
//         .toPromise();

//       return response.data;
//     } catch (error) {
//       console.log('error: ', error.response.data);
//       throw new NotFoundException(`Failed to refund payment ${refundData.payment_id}. ${String(error.response.data)}`);
//     }
//   }

//   async getRefunds(params: {
//     limit?: number;
//     cursor?: string;
//     created_at_gte?: string;
//     created_at_gt?: string;
//     created_at_lte?: string;
//     created_at_lt?: string;
//     payment_id?: string;
//     status?: string;
//   }): Promise<any> {
//     const url = `${YOOKASSA_URL}/refunds`;
//     const auth = Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64');
//     const headers = {
//       Authorization: `Basic ${auth}`,
//       'Content-Type': 'application/json',
//     };

//     try {
//       const response = await this.httpService
//         .get(url, {
//           headers,
//           params, // Передача фильтров как параметров запроса
//         })
//         .toPromise();
//       return response.data;
//     } catch (error) {
//       throw new NotFoundException(`Failed to retrieve refunds. ${String(error.response.data)}`);
//     }
//   }

//   async getRefundById(refundId: string): Promise<GetRefundResponseDto> {
//     //TODO: YOOKASSA_SHOP_ID хранить в базе для каждого конкретного заказчика
//     const shopId = process.env.YOOKASSA_SHOP_ID;
//     const secretKey = process.env.YOOKASSA_SECRET_KEY;
//     const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

//     try {
//       const response = await this.httpService
//         .get(`${YOOKASSA_URL}/refunds/${refundId}`, {
//           headers: {
//             Authorization: `Basic ${auth}`,
//             'Content-Type': 'application/json',
//           },
//         })
//         .toPromise();

//       return response.data;
//     } catch (error) {
//       throw new NotFoundException(`Failed to retrieve refund with ID: ${refundId}. ${String(error.response.data)}`);
//     }
//   }

//   private generateIdempotenceKey(): string {
//     // Генерация ключа идемпотентности, например, UUID
//     return randomBytes(16).toString('hex');
//   }

//   private createReceipt({ items, user }: { items: OrderItem[]; user: User }): {
//     customer: { email: string; phone?: string };
//     items: Array<{
//       description: string;
//       quantity: number;
//       amount: { value: string; currency: string };
//       vat_code: number;
//     }>;
//   } {
//     // Формируем данные о клиенте
//     const customer = {
//       email: user.email,
//       phone: user.phoneNumber,
//     };

//     // Формируем позиции чека
//     const receiptItems = items.map((item) => ({
//       description: item.product.title,
//       quantity: item.quantity,
//       amount: {
//         value: (item.product.price * item.quantity).toFixed(2), // Считаем сумму за позицию
//         currency: 'RUB',
//       },
//       //TODO: Ставка НДС (тег в 54 ФЗ — 1199) - хз че это, выяснить
//       vat_code: 1199, // Используем переданный НДС или дефолтный
//     }));

//     return {
//       customer,
//       items: receiptItems,
//     };
//   }

//   async getReceipts(params: {
//     limit?: number;
//     cursor?: string;
//     created_at_gte?: string;
//     created_at_gt?: string;
//     created_at_lte?: string;
//     created_at_lt?: string;
//     status?: string;
//   }): Promise<any> {
//     const url = `${YOOKASSA_URL}/receipts`;
//     const auth = Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64');
//     const headers = {
//       Authorization: `Basic ${auth}`,
//       'Content-Type': 'application/json',
//     };

//     try {
//       const response = await this.httpService
//         .get(url, {
//           headers,
//           params, // Передача фильтров как параметров запроса
//         })
//         .toPromise();

//       return response.data;
//     } catch (error) {
//       throw new NotFoundException(
//         `Failed to retrieve receipts. ${String(error.response?.data?.description || error.response?.data)}`,
//       );
//     }
//   }
// }

import { Injectable, HttpException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { randomBytes } from 'crypto';
import { YOOKASSA_URL } from './constants';
import { CreateRefundDto } from 'src/order/dto/create-refund.dto';
import { GetRefundResponseDto } from 'src/order/dto/get-refund-response.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from 'src/products/product.model';
import { CapturePaymentDto } from './dto/capture-payment.dto';
import { Order } from 'src/order/order.model';
import { OrderItem } from 'src/order/order-item.model';
import { YooKassaWebhookService } from './yookassa-webhook.service';
import { NotificationService } from 'src/websockets/notification/notification.service';
import { WS_MESSAGE_TYPE } from 'src/shared/enums/';
import { User } from 'src/users/users.model';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Order) private readonly orderModel: typeof Order,
    private readonly httpService: HttpService,
    private readonly subscriptionService: YooKassaWebhookService,
    private readonly notificationService: NotificationService,
  ) {}

  private getAuthHeader(): string {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`;
  }

  private generateIdempotenceKey(): string {
    return randomBytes(16).toString('hex');
  }

  private createHeaders(idempotenceKey?: string): Record<string, string> {
    return {
      Authorization: this.getAuthHeader(),
      'Content-Type': 'application/json',
      ...(idempotenceKey && { 'Idempotence-Key': idempotenceKey }),
    };
  }

  private createReceipt({ items, user }: { items: OrderItem[]; user: User }) {
    const customer = {
      email: user.email,
      phone: user.phoneNumber,
    };

    const receiptItems = items.map((item) => {

      return {
        description: item.product.title,
        quantity: item.quantity,
        amount: {
          value: Number(item.price).toFixed(2),
          currency: 'RUB',
        },
        //TODO: узнать че за vat_code
        vat_code: 1,
      }
    });

    return { customer, items: receiptItems };
  }

  private async makeHttpRequest<T>(
    url: string,
    method: 'GET' | 'POST',
    data?: any,
    headers?: Record<string, string>,
    params?: Record<string, any>, // Новый аргумент для параметров запроса
  ): Promise<T> {
    try {
      const response = await this.httpService.request<T>({
        url,
        method,
        data,
        headers,
        params, // Передаем параметры в запрос
      }).toPromise();
  
      return response.data;
    } catch (error) {
      throw new NotFoundException(error.response?.data || 'Unexpected error occurred');
    }
  }
  

  async createPayment({
    amount,
    currency,
    description,
    returnUrl,
    metadata,
    user,
    items,
  }: {
    amount: string;
    currency: string;
    description: string;
    returnUrl: string;
    metadata: Record<string, any>;
    user: User;
    items: OrderItem[];
  }): Promise<any> {
    const receipt = this.createReceipt({ items, user });

    const body = {
      amount: { value: Number(amount).toFixed(2), currency },
      payment_method_data: { type: 'bank_card' },
      confirmation: { type: 'redirect', return_url: returnUrl },
      capture: true,
      description,
      metadata,
      receipt,
    };

    const headers = this.createHeaders(this.generateIdempotenceKey());

    await this.notificationService.sendNotificationToAdmin({
      type: WS_MESSAGE_TYPE.NEW_PAYMENT,
      payload: body,
    });

    await this.notificationService.sendUserNotifications({
      recipientUserIds: [user.id], 
      message: {
      type: WS_MESSAGE_TYPE.NEW_PAYMENT,
      payload: body,
    }});

    return this.makeHttpRequest(`${YOOKASSA_URL}/payments`, 'POST', body, headers);
  }

  async payForOrder(orderId: number): Promise<any> {
    const order = await this.orderModel.findOne({
      where: { id: orderId },
      include: [
        { model: OrderItem, include: [{ model: Product }] },
        { model: User, attributes: ['id', 'email', 'phoneNumber'] },
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found.`);
    }

    if (order.paymentStatus !== 'pending') {
      throw new Error(`Order with ID ${orderId} cannot be paid. Current payment status: ${order.paymentStatus}`);
    }

    const paymentResult = await this.createPayment({
      amount: order.totalPrice.toString(),
      currency: 'RUB',
      description: `Оплата за заказ ${order.id}`,
      returnUrl: `${process.env.FRONTEND_URL}/order-confirmation/${order.id}`,
      metadata: { order_id: order.id },
      user: order.user,
      items: order.items,
    });

    order.transactionId = paymentResult.id;
    order.paymentStatus = 'pending';
    order.paymentUrl = paymentResult.confirmation.confirmation_url;
    await order.save();

    await this.subscriptionService.createSubscription({
      transactionId: paymentResult.id,
      orderId,
      status: 'pending',
    });

    return {
      id: order.id,
      totalPrice: order.totalPrice,
      quantity: order.quantity,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      transactionId: order.transactionId,
      paymentUrl: order.paymentUrl,
    };
  }

  async getPayments(params: Record<string, any>): Promise<any> {
    const headers = this.createHeaders();
    return this.makeHttpRequest(`${YOOKASSA_URL}/payments`, 'GET', null, headers, params );
  }

  async getPaymentById(paymentId: string): Promise<any> {
    const headers = this.createHeaders();
    return this.makeHttpRequest(`${YOOKASSA_URL}/payments/${paymentId}`, 'GET', null, headers);
  }

  async capturePayment(paymentId: string, captureData?: CapturePaymentDto): Promise<any> {
    const headers = this.createHeaders();
    return this.makeHttpRequest(`${YOOKASSA_URL}/payments/${paymentId}/capture`, 'POST', captureData, headers);
  }

  async cancelPayment(paymentId: string): Promise<any> {
    const headers = this.createHeaders();
    return this.makeHttpRequest(`${YOOKASSA_URL}/payments/${paymentId}/cancel`, 'POST', {}, headers);
  }

  async createRefund(refundData: CreateRefundDto): Promise<any> {
    const headers = this.createHeaders(this.generateIdempotenceKey());
    return this.makeHttpRequest(`${YOOKASSA_URL}/refunds`, 'POST', refundData, headers);
  }

  async getRefunds(params: Record<string, any>): Promise<any> {
    const headers = this.createHeaders();
    return this.makeHttpRequest(`${YOOKASSA_URL}/refunds`, 'GET', null, headers, params );
  }

  async getRefundById(refundId: string): Promise<GetRefundResponseDto> {
    const headers = this.createHeaders();
    return this.makeHttpRequest(`${YOOKASSA_URL}/refunds/${refundId}`, 'GET', null, headers);
  }

  async getReceipts(params: Record<string, any>): Promise<any> {
    const headers = this.createHeaders();
    return this.makeHttpRequest(`${YOOKASSA_URL}/receipts`, 'GET', null, headers, params);
  }
}
