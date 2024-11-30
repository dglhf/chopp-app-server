import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from './category.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Sequelize, Op } from 'sequelize';
import { UpdateCategoriesDto } from './dto/update-categories.dto';

@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectModel(Category)
    private categoryModel: typeof Category,
  ) {}

  async onModuleInit() {
    const categories = await this.categoryModel.findAll();
    const categoriesNames = categories.map((item) => item.title);

    if (!categoriesNames.includes('Без категории')) {
      this.categoryModel.create({
        title: 'Без категории',
        order: categories.length,
      });

      this.logger.log('Created default category: Без категории');
    }
  }

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

  async updateCategories(dtos: UpdateCategoriesDto[]): Promise<Category[]> {
    const updatedCategories = dtos.map(async (dto) => {
      const category = await this.categoryModel.findByPk(dto.id);
      if (category) {
        return category.update(dto);
      }
    });
    return Promise.all(updatedCategories);
  }

  async updateCategoryTitle(id: number, newTitle: string): Promise<Category> {
    const category = await this.categoryModel.findByPk(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Запрещаем редактировать категорию "Без категории"
    if (category.title === 'Без категории') {
      throw new HttpException(
        'Cannot edit the title of the default category "Без категории"',
        HttpStatus.FORBIDDEN,
      );
    }

    // Проверяем, не существует ли уже категории с таким названием
    const existingCategory = await this.categoryModel.findOne({
      where: { title: newTitle },
    });
    if (existingCategory) {
      throw new HttpException(
        `Category with title "${newTitle}" already exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    category.title = newTitle;
    await category.save();
    return category;
  }

  async deleteCategory(id: number): Promise<Category[]> {
    const categoryToDelete = await this.categoryModel.findByPk(id);
    if (!categoryToDelete) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Проверяем, если это категория с названием "Без категории"
    if (categoryToDelete.title === 'Без категории') {
      throw new HttpException(
        'Cannot delete the default category "Без категории"',
        HttpStatus.FORBIDDEN,
      );
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
