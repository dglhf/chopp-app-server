import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './order.model';
import { User } from 'src/users/users.model';
import { ShoppingCartItem } from 'src/shopping-cart/shopping-cart-item.model';
import { PaymentService } from 'src/payment/payment.service';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Order, User, ShoppingCartItem]),
    forwardRef(() => AuthModule),
    PaymentModule
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}