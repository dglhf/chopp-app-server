import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from './product.model';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product) private productRepository: typeof Product,
  ) {}

  async createProduct(data: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(data);
    return this.productRepository.create(product);
  }
}
