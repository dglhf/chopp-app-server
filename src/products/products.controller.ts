import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { File } from 'multer';
import { FilesService } from '../files/files.service';
import { ProductService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(
    private productService: ProductService,
    private filesService: FilesService,
  ) {}

  @Post()
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
      images: imageUrls,
    });
  }
}
