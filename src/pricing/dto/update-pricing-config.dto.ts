import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdatePricingConfigDto {
  @IsNumber()
  @IsOptional()
  averageDeliveryCost?: number;

  @IsBoolean()
  @IsOptional()
  freeDeliveryIncluded?: boolean;

  @IsNumber()
  @IsOptional()
  freeDeliveryThreshold?: number;
}
