import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PricingConfig } from './pricing-config.model';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([PricingConfig]),
    forwardRef(() => AuthModule),
  ],
  controllers: [PricingController],
  providers: [PricingService],
})
export class PricingModule {}
