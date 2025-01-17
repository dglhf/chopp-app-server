import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './order.model';
import { User } from 'src/users/users.model';
import { ShoppingCartItem } from 'src/shopping-cart/shopping-cart-item.model';
import { PaymentsModule } from 'src/payment/payments.module';
import { ShoppingCart } from 'src/shopping-cart/shopping-cart.model';
import { OrderItem } from './order-item.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Order, OrderItem, User, ShoppingCart]),
    forwardRef(() => AuthModule),
    PaymentsModule
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}