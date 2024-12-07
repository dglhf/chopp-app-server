import { ApiProperty } from '@nestjs/swagger';
import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table({ tableName: 'pricing' })
export class PricingConfig extends Model<PricingConfig> {
  @ApiProperty({
    example: '1',
    description: 'The unique identifier for the pricing configuration',
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    defaultValue: 1,
  })
  id: number;

  @ApiProperty({
    example: '20.00',
    description: 'Average cost of delivery, can be null if not specified',
  })
  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  averageDeliveryCost?: number;

  @ApiProperty({
    example: 'false',
    description: 'Indicates if free delivery is included, defaults to false',
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  freeDeliveryIncluded: boolean;

  @ApiProperty({
    example: '100.00',
    description: 'Threshold for free delivery, can be null if not specified',
  })
  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  freeDeliveryThreshold?: number;
}
