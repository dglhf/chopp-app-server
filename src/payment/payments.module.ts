import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { AuthModule } from 'src/auth/auth.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { ShoppingCart } from 'src/shopping-cart/shopping-cart.model';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([ShoppingCart]),
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
