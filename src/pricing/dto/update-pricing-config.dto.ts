import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdatePricingConfigDto {
  @ApiProperty({
    example: 20.0,
    description: 'Average cost of delivery. Can be null if not specified.',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  averageDeliveryCost?: number;

  @ApiProperty({
    example: false,
    description: 'Indicates if free delivery is included. Defaults to false.',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  freeDeliveryIncluded?: boolean;

  @ApiProperty({
    example: 100.0,
    description: 'Threshold for free delivery. Can be null if not specified.',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  freeDeliveryThreshold?: number;
}
