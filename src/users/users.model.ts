import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Role } from '../roles/roles.model';
import { UserRoles } from 'src/roles/user-roles.model';
import { UserRO } from './dto/create-user.dto';
import { UserChats } from 'src/chats/user-chats.model';
import { Chat } from 'src/chats/chats.model';

interface UserCreationAttrs {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}

@Table({ tableName: 'users' })
export class User extends Model<User, UserCreationAttrs> {
  @ApiProperty({ example: '1', description: 'primary key id' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({ example: 'user@gmail.com', description: 'unique email' })
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  email: string;

  @ApiProperty({ example: '1234', description: 'password' })
  @Column({ type: DataType.STRING, allowNull: false })
  password: string;

  @ApiProperty({ example: 'Ivan Pupkin', description: 'full name, splitted' })
  @Column({ type: DataType.STRING, allowNull: false })
  fullName: string;

  @ApiProperty({
    example: '8-989-898-98-98',
    description: 'phone number like string',
  })
  @Column({ type: DataType.STRING, allowNull: false })
  phoneNumber: string;

  @BelongsToMany(() => Role, () => UserRoles)
  roles: Role[];

  @BelongsToMany(() => Chat, () => UserChats)
  chats: Chat[];

  sanitizeUser(): UserRO {
    const responseObject: UserRO = { ...this };

    return responseObject;
  }
}
