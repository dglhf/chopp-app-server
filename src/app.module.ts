import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './users/users.model';
import { RolesModule } from './roles/roles.module';
import { Role } from './roles/roles.model';
import { UserRoles } from './roles/user-roles.model';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { PricingModule } from './pricing/pricing.module';
import { ProductsModule } from './products/products.module';
import { FilesModule } from './files/files.module';
import { Category } from './categories/category.model';
import { Product } from './products/product.model';
import { PricingConfig } from './pricing/pricing-config.model';
import { FileModel } from './files/file.model';
import { ProductFile } from './products/product-file.model';
import { WebsocketsModule } from './websockets/websockets.module';
import { Chat } from './websockets/chats/chats.model';
import { UserChats } from './websockets/chats/user-chats.model';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'client'),
    // }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [
        User,
        Role,
        Chat,
        UserRoles,
        UserChats,
        Category,
        Product,
        PricingConfig,
        FileModel,
        ProductFile,
      ],
      autoLoadModels: true,
    }),
    UsersModule,
    RolesModule,
    AuthModule,
    // ChatsModule,
    WebsocketsModule,
    CategoriesModule,
    PricingModule,
    ProductsModule,
    FilesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
