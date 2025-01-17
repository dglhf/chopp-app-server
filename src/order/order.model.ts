import {
  Column,
  Model,
  Table,
  ForeignKey,
  DataType,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { ShoppingCartItem } from 'src/shopping-cart/shopping-cart-item.model';
import { User } from 'src/users/users.model';
import { OrderItem } from './order-item.model';

@Table({ tableName: 'orders' })
export class Order extends Model<Order> {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @HasMany(() => OrderItem)
  items: OrderItem[];

  @Column({ type: DataType.FLOAT })
  totalPrice: number;

  @Column({ type: DataType.INTEGER })
  quantity: number;

  @Column({ type: DataType.TEXT })
  orderStatus: string;

  @Column({ type: DataType.TEXT })
  paymentStatus: string;

  @Column({ type: DataType.TEXT })
  transactionId: string;

  //TODO: удалить, paymentUrl здесь не нужен, можно взять из payments? 
  @Column({ type: DataType.TEXT })
  paymentUrl: string;
}
