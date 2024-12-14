import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from './product.model';
import { CreateProductDto } from './dto/create-product.dto';
import { Category } from 'src/categories/category.model';
import { Op } from 'sequelize';
import { UpdateProductDto } from './dto/update-product.dto';

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

  async updateProduct(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findByPk(id);
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    const updatedProduct = await product.update(dto);
    return updatedProduct;
  }

  async findAllProducts(
    page: number,
    limit: number,
    categoryId: number,
    search: string,
    sort: string,
    order: string,
  ) {
    const offset = (page - 1) * limit;
    const whereCondition = {
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            [Op.or]: [
              { title: { [Op.iLike]: `%${search}%` } },
              { description: { [Op.iLike]: `%${search}%` } },
            ],
          }
        : {}),
    };

    const { rows: items, count: totalItems } =
      await this.productRepository.findAndCountAll({
        where: whereCondition,
        limit,
        offset,
        order: [[sort, order.toUpperCase()]],
        include: [{ model: Category }],
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
