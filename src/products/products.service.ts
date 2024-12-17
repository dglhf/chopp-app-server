import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from './product.model';
import { CreateProductDto } from './dto/create-product.dto';
import { Category } from 'src/categories/category.model';
import { Op } from 'sequelize';
import { FileModel } from 'src/files/file.model';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product) private productRepository: typeof Product,
    @InjectModel(FileModel) private fileRepository: typeof FileModel,
  ) {}

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

    const product = await this.productRepository.create({
      title: dto.title,
      description: dto.description,
      price: dto.price,
      categoryId: dto.categoryId,
      imagesOrder: dto.imageIds,
    });

    // Связать изображения с продуктом
    if (dto.imageIds && dto.imageIds.length > 0) {
      await product.$set('images', dto.imageIds);
    }

    return this.productRepository.findByPk(product.id, {
      include: [
        {
          model: FileModel,
          through: { attributes: [] }, // Опционально: не включать атрибуты из промежуточной таблицы
        },
        Category,
      ],
      attributes: {
        exclude: ['categoryId'],
      },
    });
  }

  // async updateProduct(id: number, dto: UpdateProductDto): Promise<Product> {
  //   const product = await this.productRepository.findByPk(id);
  //   if (!product) {
  //     throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
  //   }

  //   const updatedProduct = await product.update(dto);
  //   return updatedProduct;
  // }

  async findAllProducts(
    pageNumber: number = 1,
    limit: number = 10,
    categoryId?: number,
    search?: string,
    sort: string = 'id', // значение по умолчанию для сортировки
    order: string = 'ASC', // значение по умолчанию для порядка сортировки
  ) {
    const offset = (pageNumber - 1) * limit;
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
        order: sort ? [[sort, order.toUpperCase()]] : [],
        include: [
          {
            model: FileModel,
            as: 'images',
          },
          {
            model: Category,
          },
        ],
        attributes: {
          exclude: ['categoryId'],
        },
      });

    return {
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      pageNumber,
      limit,
    };
  }
}
