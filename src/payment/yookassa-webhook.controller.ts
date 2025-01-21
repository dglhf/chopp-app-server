import { Controller, Post, Body } from '@nestjs/common';
import { YooKassaWebhookService } from './yookassa-webhook.service';
import { OrderService } from 'src/order/order.service';

@Controller('yookassa/webhook')
export class YooKassaWebhookController {
  constructor(
    private readonly subscriptionService: YooKassaWebhookService,
    private readonly orderService: OrderService, // Инжектируем OrderService
  ) {}

  @Post()
  async handleWebhook(@Body() payload: any): Promise<{ status: string }> {
    const { event, object } = payload;

    switch (event) {
      case 'payment.succeeded':
          await this.orderService.updateOrderPaymentStatus(object.id, 'succeeded'); // Используем метод из OrderService
          await this.subscriptionService.updateSubscriptionStatus(object.id, 'succeeded');
        await this.subscriptionService.removeSubscription(object.id);
        break;

      case 'payment.canceled':
          await this.orderService.updateOrderPaymentStatus(object.id, 'canceled'); // Используем метод из OrderService
          await this.subscriptionService.updateSubscriptionStatus(object.id, 'canceled');
        await this.subscriptionService.removeSubscription(object.id);
        break;

      default:
        console.warn(`Необработанное событие: ${event}`);
    }

    return { status: 'ok' };
  }
}
