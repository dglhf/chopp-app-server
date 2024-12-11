import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from './product.model';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product) private productRepository: typeof Product,
  ) {}

  // async createProduct(data: CreateProductDto): Promise<Product> {
  //   console.log('createProduct: ', data)
  //   const product = this.productRepository.create(data);
  //   return this.productRepository.create(product);
  // }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const existingProduct = await this.productRepository.findOne({
      where: { title: dto.title },
    });

    if (existingProduct) {
      throw new HttpException(
        'Product with this title already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const product = await this.productRepository.create(dto);
    return product;
  }
}
