import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  Get,
  Query,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { File } from 'multer';
import { FilesService } from '../files/files.service';
import { ProductService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private productService: ProductService,
    private filesService: FilesService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data') // Определяем тип контента, так как это загрузка файлов
  @ApiBody({
    description: 'Create a new product with images',
    type: CreateProductDto,
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 5 }]))
  async createProduct(
    @UploadedFiles() files: { images?: File[] },
    @Body() productData: CreateProductDto,
  ) {
    const imageUrls = await Promise.all(
      files.images?.map((file) => this.filesService.uploadFile(file)) || [],
    );

    return this.productService.createProduct({
      ...productData,
      images: imageUrls.map((item) => item.path),
    });
  }

  // В ProductsController
  @Get()
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit of products per page',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: Number,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by title or description',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Sort key',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    type: String,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  async getAllProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('categoryId') categoryId: number,
    @Query('search') search: string,
    @Query('sort') sort: string = 'id',
    @Query('order') order: string = 'ASC',
  ) {
    return this.productService.findAllProducts(
      page,
      limit,
      categoryId,
      search,
      sort,
      order,
    );
  }
}
