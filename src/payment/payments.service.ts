import { Injectable, HttpException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { randomBytes } from 'crypto';
import { YOOKASSA_URL } from './constants';
import { CreateRefundDto } from 'src/order/dto/create-refund.dto';
import { GetRefundsResponseDto } from 'src/order/dto/get-refunds-response.dto';
import { GetRefundResponseDto } from 'src/order/dto/get-refund-response.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from 'src/products/product.model';
import { ShoppingCartItem } from 'src/shopping-cart/shopping-cart-item.model';
import { ShoppingCart } from 'src/shopping-cart/shopping-cart.model';
import { CapturePaymentDto } from './dto/capture-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private httpService: HttpService,
    @InjectModel(ShoppingCart) private shoppingCartModel: typeof ShoppingCart,
  ) {}

  async createPayment(userId: number, returnUrl: string): Promise<any> {
    const cart = await this.shoppingCartModel.findOne({
      where: { userId },
      include: [{ model: ShoppingCartItem, include: [{ model: Product }] }],
    });

    if (!cart || cart.items.length === 0) {
      throw new NotFoundException('Корзина пуста или не найдена.');
    }

    const totalAmount = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.product.price,
      0,
    );

    console.log('---cart: ', cart)

    //TODO: YOOKASSA_SHOP_ID хранить в базе для каждого конкретного заказчика
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

    const headers = {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      //TODO: разобраться с ключом идемпотентности
      'Idempotence-Key': this.generateIdempotenceKey(),
    };
    const body = {
      amount: {
        value: totalAmount,
        currency: 'RUB',
      },
      payment_method_data: {
        type: 'bank_card',
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      description: 'description',
    };

    try {
      const response = await this.httpService
        .post(`${YOOKASSA_URL}/payments`, body, { headers })
        .toPromise();
      return response.data;
    } catch (error) {
      throw new NotFoundException(
        `Failed to initiate payment. ${String(error.response.data?.description || error.response.data)}`,
      );
    }
  }

  async getPayments(params: {
    limit?: number;
    cursor?: string;
    created_at_gte?: string;
    created_at_gt?: string;
    created_at_lte?: string;
    created_at_lt?: string;
    payment_id?: string;
    status?: string;
  }): Promise<any> {
    const url = `${YOOKASSA_URL}/payments`;
    const auth = Buffer.from(
      `${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`,
    ).toString('base64');
    const headers = {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await this.httpService
        .get(url, {
          headers,
          params, // Передача фильтров как параметров запроса
        })
        .toPromise();
      return response.data;
    } catch (error) {
      throw new NotFoundException(
        `Failed to retrieve payments. ${String(error.response.data)}`,
      );
    }
  }

  async getPaymentById(paymentId: string): Promise<any> {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

    try {
      const response = await this.httpService
        .get(`${YOOKASSA_URL}/payments/${paymentId}`, {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        })
        .toPromise();

      return response.data;
    } catch (error) {
      throw new NotFoundException(
        `Payment with ID ${paymentId} not found. ${String(error.response.data)}`,
      );
    }
  }

  async capturePayment(
    paymentId: string,
    captureData?: CapturePaymentDto,
  ): Promise<any> {
    //TODO: YOOKASSA_SHOP_ID хранить в базе для каждого конкретного заказчика
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

    try {
      const response = await this.httpService
        .post(`${YOOKASSA_URL}/payments/${paymentId}/capture`, captureData, {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        })
        .toPromise();

      return response.data;
    } catch (error) {
      throw new NotFoundException(
        `Failed to capture payment: ${paymentId}. ${String(error.response.data)}`,
      );
    }
  }

  async cancelPayment(paymentId: string): Promise<any> {
    //TODO: YOOKASSA_SHOP_ID хранить в базе для каждого конкретного заказчика
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

    try {
      const response = await this.httpService
        .post(
          `${YOOKASSA_URL}/payments/${paymentId}/cancel`,
          {},
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
          },
        )
        .toPromise();

      return response.data;
    } catch (error) {
      throw new NotFoundException(
        `Failed to cancel payment. ${String(error.response.data)}`,
      );
    }
  }

  async createRefund(refundData: CreateRefundDto): Promise<any> {
    //TODO: YOOKASSA_SHOP_ID хранить в базе для каждого конкретного заказчика
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

    try {
      const response = await this.httpService
        .post(`${YOOKASSA_URL}/refunds`, refundData, {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
            //TODO: разобраться с ключом идемпотентности
            'Idempotence-Key': this.generateIdempotenceKey(),
          },
        })
        .toPromise();

      return response.data;
    } catch (error) {
      console.log('error: ', error.response.data);
      throw new NotFoundException(
        `Failed to refund payment ${refundData.payment_id}. ${String(error.response.data)}`,
      );
    }
  }

  async getRefunds(params: {
    limit?: number;
    cursor?: string;
    created_at_gte?: string;
    created_at_gt?: string;
    created_at_lte?: string;
    created_at_lt?: string;
    payment_id?: string;
    status?: string;
  }): Promise<any> {
    const url = `${YOOKASSA_URL}/refunds`;
    const auth = Buffer.from(
      `${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`,
    ).toString('base64');
    const headers = {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await this.httpService
        .get(url, {
          headers,
          params, // Передача фильтров как параметров запроса
        })
        .toPromise();
      return response.data;
    } catch (error) {
      throw new NotFoundException(
        `Failed to retrieve refunds. ${String(error.response.data)}`,
      );
    }
  }

  async getRefundById(refundId: string): Promise<GetRefundResponseDto> {
    //TODO: YOOKASSA_SHOP_ID хранить в базе для каждого конкретного заказчика
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

    try {
      const response = await this.httpService
        .get(`${YOOKASSA_URL}/refunds/${refundId}`, {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        })
        .toPromise();

      return response.data;
    } catch (error) {
      throw new NotFoundException(
        `Failed to retrieve refund with ID: ${refundId}. ${String(error.response.data)}`,
      );
    }
  }

  private generateIdempotenceKey(): string {
    // Генерация ключа идемпотентности, например, UUID
    return randomBytes(16).toString('hex');
  }
}
