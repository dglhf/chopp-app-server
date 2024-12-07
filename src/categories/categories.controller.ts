import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoriesService } from './categories.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Category } from './category.model';

import { UpdateCategoriesDto } from './dto/update-categories.dto';
import { UpdateCategoryDto } from './dto/update-category-title.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create category' })
  @UseGuards(JwtAuthGuard)
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.createCategory(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @UseGuards(JwtAuthGuard)
  getAllCategories(): Promise<Category[]> {
    return this.categoriesService.getAllCategories();
  }

  @Put()
  @ApiOperation({ summary: 'Update multiple categories' })
  @UseGuards(JwtAuthGuard)
  updateCategories(
    @Body() updateCategoriesDtos: UpdateCategoriesDto[],
  ): Promise<Category[]> {
    return this.categoriesService.updateCategories(updateCategoriesDtos);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category and return updated list' })
  @UseGuards(JwtAuthGuard)
  async deleteCategory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Category[]> {
    return this.categoriesService.deleteCategory(id);
  }

  @Put(':id/title')
  @ApiOperation({ summary: 'Update category title' })
  @UseGuards(JwtAuthGuard)
  async updateCategoryTitle(
    @Param('id', ParseIntPipe) id: number,
    @Body() { title }: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.updateCategoryTitle(id, title);
  }
}
