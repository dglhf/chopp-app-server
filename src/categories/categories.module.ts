import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category } from './category.model';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Category]),
    forwardRef(() => AuthModule),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
