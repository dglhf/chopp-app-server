import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table({ tableName: 'files' })
export class FileModel extends Model<FileModel> {
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  hash: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  path: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  originalName: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  size: number;
}
