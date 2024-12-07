import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CreatePricingConfigDto {
  @IsNumber()
  @IsOptional()
  id?: number; // Сделать поле необязательным

  @IsNumber()
  averageDeliveryCost: number;

  @IsBoolean()
  freeDeliveryIncluded: boolean;

  @IsNumber()
  freeDeliveryThreshold: number;
}
