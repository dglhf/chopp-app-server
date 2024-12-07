import { ApiProperty } from '@nestjs/swagger';

export class CreatePricingConfigDto {
  @ApiProperty({
    example: 20.0,
    description: 'Average cost of delivery, can be null if not specified',
    required: false,
  })
  averageDeliveryCost?: number;

  @ApiProperty({
    example: false,
    description: 'Indicates if free delivery is included, defaults to false',
    required: false,
  })
  freeDeliveryIncluded?: boolean;

  @ApiProperty({
    example: 100.0,
    description: 'Threshold for free delivery, can be null if not specified',
    required: false,
  })
  freeDeliveryThreshold?: number;
}
