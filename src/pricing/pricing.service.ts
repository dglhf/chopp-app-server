import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreatePricingConfigDto } from './dto/create-pricing-config.dto';
import { PricingConfig } from './pricing-config.model';

@Injectable()
export class PricingService implements OnModuleInit {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @InjectModel(PricingConfig)
    private pricingModel: typeof PricingConfig,
  ) {}

  async onModuleInit() {
    const existingConfig = await this.pricingModel.findByPk(1);
    if (!existingConfig) {
      await this.pricingModel.create({ id: 1, freeDeliveryIncluded: false });

      this.logger.log('🚀 Создан пустой PRICING конфиг');
    }
  }

  async createOrUpdateConfig(
    dto: CreatePricingConfigDto,
  ): Promise<PricingConfig> {
    const config = await this.pricingModel.findByPk(1);
    if (config) {
      return config.update(dto);
    } else {
      // Поскольку у нас всегда должен быть id=1, создаем напрямую с этим id
      return this.pricingModel.create({ ...dto, id: 1 });
    }
  }

  async getConfig(): Promise<PricingConfig> {
    return this.pricingModel.findByPk(1);
  }
}
