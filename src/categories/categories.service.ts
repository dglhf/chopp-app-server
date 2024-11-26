import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from './category.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category)
    private categoryModel: typeof Category,
  ) {}

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
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
}
