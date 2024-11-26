import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table({ tableName: 'categories' })
export class Category extends Model<Category> {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  order: number;
}
