import { BelongsToMany, Column, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "src/users/users.model";
import { UserChats } from "./user-chats.model";

@Table({ tableName: 'chats' })
export class Chat extends Model {
  @Column
  message: string;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsToMany(() => User, () => UserChats)
  users: User[];
}
