import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from './category.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Sequelize, Op } from 'sequelize';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category)
    private categoryModel: typeof Category,
  ) {}

  //   TODO: Сделать при бутстрпе дефолтную категорию "Без категории"
  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    const existingCategory = await this.categoryModel.findOne({
      where: { title: dto.title },
    });

    if (existingCategory) {
      throw new HttpException(
        'Category with this title already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const category = await this.categoryModel.create(dto);
    return category;
  }

  async getAllCategories(): Promise<Category[]> {
    return this.categoryModel.findAll();
  }

  async updateCategories(dtos: UpdateCategoryDto[]): Promise<Category[]> {
    const updatedCategories = dtos.map(async (dto) => {
      const category = await this.categoryModel.findByPk(dto.id);
      if (category) {
        return category.update(dto);
      }
    });
    return Promise.all(updatedCategories);
  }

  async deleteCategory(id: number): Promise<Category[]> {
    const categoryToDelete = await this.categoryModel.findByPk(id);
    if (!categoryToDelete) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return await this.categoryModel.sequelize.transaction(async (t) => {
      await categoryToDelete.destroy({ transaction: t });
      await this.categoryModel.update(
        { order: Sequelize.literal('"order" - 1') },
        {
          where: { order: { [Op.gt]: categoryToDelete.order } },
          transaction: t,
        },
      );

      // Returning the updated list of categories
      return this.categoryModel.findAll({
        order: [['order', 'ASC']],
        transaction: t,
      });
    });
  }
}
