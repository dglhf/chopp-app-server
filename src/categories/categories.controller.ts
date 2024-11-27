import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoriesService } from './categories.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Category } from './category.model';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create category' })
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.createCategory(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  getAllCategories(): Promise<Category[]> {
    return this.categoriesService.getAllCategories();
  }

  @Put()
  @ApiOperation({ summary: 'Update multiple categories' })
  updateCategories(
    @Body() updateCategoryDtos: UpdateCategoryDto[],
  ): Promise<Category[]> {
    return this.categoriesService.updateCategories(updateCategoryDtos);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category and return updated list' })
  async deleteCategory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Category[]> {
    return this.categoriesService.deleteCategory(id);
  }
}
