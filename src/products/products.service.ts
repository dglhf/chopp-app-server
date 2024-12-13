import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from './product.model';
import { CreateProductDto } from './dto/create-product.dto';
import { Category } from 'src/categories/category.model';

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

  async findAllProducts(
    page: number,
    limit: number,
    categoryId: number,
    sort: string,
    order: string,
  ) {
    const offset = (page - 1) * limit;
    const whereCondition = categoryId ? { categoryId } : {};

    const { rows: items, count: totalItems } =
      await this.productRepository.findAndCountAll({
        where: whereCondition,
        limit,
        offset,
        include: [{ model: Category }],
        order: [[sort, order.toUpperCase()]],
        attributes: {
          exclude: ['categoryId'],
        },
      });

    return {
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      page,
    };
  }
}
