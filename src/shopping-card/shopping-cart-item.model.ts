import {
  Column,
  Model,
  Table,
  ForeignKey,
  DataType,
  BelongsTo,
} from 'sequelize-typescript';
import { ShoppingCart } from './shopping-cart.model';
import { Product } from 'src/products/product.model';

@Table({ tableName: 'shopping_cart_items' })
export class ShoppingCartItem extends Model<ShoppingCartItem> {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    unique: true,
  })
  productId: number;

  @BelongsTo(() => Product)
  product: Product;

  @ForeignKey(() => ShoppingCart)
  @Column({
    type: DataType.INTEGER,
  })
  shoppingCartId: number;

  @BelongsTo(() => ShoppingCart)
  shoppingCart: ShoppingCart;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  quantity: number;
}
