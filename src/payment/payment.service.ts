import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { randomBytes } from 'crypto';
import { PAYMENT_URL } from './constants';

@Injectable()
export class PaymentService {
  constructor(
    private httpService: HttpService,
  ) {}

  async createPayment(orderDetails: any): Promise<any> {
    //TODO: YOOKASSA_SHOP_ID хранить в базе для каждого конкретного заказчика
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

    const headers = {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      //TODO: разобраться с ключом идемпотентности
      'Idempotence-Key': this.generateIdempotenceKey()
    };
    const body = {
      amount: {
        value: orderDetails.amount,
        currency: 'RUB',
      },
      payment_method_data: {
        type: 'bank_card',
      },
      confirmation: {
        type: 'redirect',
        return_url: orderDetails.returnUrl,
      },
      description: orderDetails.description,
    };

    try {
      const response = await this.httpService
        .post(PAYMENT_URL, body, { headers })
        .toPromise();
      return response.data;
    } catch (error) {
      console.log('-------error', error.response)
      throw new HttpException(
        'Failed to initiate payment',
        error.response.status,
      );
    }
  }

  private generateIdempotenceKey(): string {
    // Генерация ключа идемпотентности, например, UUID
    return randomBytes(16).toString("hex");
  }
}
