// import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/sequelize';
// import { Product } from './product.model';
// import { CreateProductDto } from './dto/create-product.dto';
// import { Category } from 'src/categories/category.model';
// import { Op } from 'sequelize';
// import { FileModel } from 'src/files/file.model';
// import { UpdateProductDto } from './dto/update-product.dto';

// @Injectable()
// export class ProductService {
//   constructor(
//     @InjectModel(Product) private productRepository: typeof Product,
//     @InjectModel(FileModel) private fileRepository: typeof FileModel,
    
//   ) {}

//   async createProduct(dto: CreateProductDto): Promise<Product> {
//     const existingProduct = await this.productRepository.findOne({
//       where: { title: dto.title },
//     });

//     if (existingProduct) {
//       throw new HttpException(
//         'Product with this title already exists',
//         HttpStatus.BAD_REQUEST,
//       );
//     }

//     const product = await this.productRepository.create({
//       title: dto.title,
//       description: dto.description,
//       price: dto.price,
//       categoryId: dto.categoryId,
//       imagesOrder: dto.imageIds,
//     });

//     // Связать изображения с продуктом
//     if (dto.imageIds && dto.imageIds.length > 0) {
//       await product.$set('images', dto.imageIds);
//     }

//     return this.productRepository.findByPk(product.id, {
//       include: [
//         {
//           model: FileModel,
//           through: { attributes: [] }, // Опционально: не включать атрибуты из промежуточной таблицы
//         },
//         Category,
//       ],
//       attributes: {
//         exclude: ['categoryId'],
//       },
//     });
//   }

//   async updateProduct(dto: UpdateProductDto): Promise<Product> {
//     const existingProduct = await this.productRepository.findOne({
//       where: { id: dto.id },
//     });

//     existingProduct.update({
//       title: dto.title,
//       description: dto.description,
//       price: dto.price,
//       categoryId: dto.categoryId,
//       imagesOrder: dto.imageIds,
//     });

//     // Связать изображения с продуктом
//     if (dto.imageIds && dto.imageIds.length > 0) {
//       await existingProduct.$set('images', dto.imageIds);
//     }

//     return this.productRepository.findByPk(existingProduct.id, {
//       include: [
//         {
//           model: FileModel,
//           through: { attributes: [] }, // Опционально: не включать атрибуты из промежуточной таблицы
//         },
//         Category,
//       ],
//       attributes: {
//         exclude: ['categoryId'],
//       },
//     });
//   }

//   async findAllProducts(
//     pageNumber: number = 1,
//     limit: number = 10,
//     categoryId?: number,
//     search?: string,
//     sort: string = 'id', // значение по умолчанию для сортировки
//     order: string = 'ASC', // значение по умолчанию для порядка сортировки
//   ) {
//     const offset = (pageNumber - 1) * limit;
//     const whereCondition = {
//       ...(categoryId ? { categoryId } : {}),
//       ...(search
//         ? {
//             [Op.or]: [
//               { title: { [Op.iLike]: `%${search}%` } },
//               { description: { [Op.iLike]: `%${search}%` } },
//             ],
//           }
//         : {}),
//     };

//     const { rows: items, count: totalItems } =
//       await this.productRepository.findAndCountAll({
//         where: whereCondition,
//         limit,
//         offset,
//         order: sort ? [[sort, order.toUpperCase()]] : [],
//         include: [
//           {
//             model: FileModel,
//             as: 'images',
//           },
//           {
//             model: Category,
//           },
//         ],
//         attributes: {
//           exclude: ['categoryId'],
//         },
//       });

//     return {
//       items,
//       totalItems,
//       totalPages: Math.ceil(totalItems / limit),
//       pageNumber,
//       limit,
//     };
//   }
// }


import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from './product.model';
import { CreateProductDto } from './dto/create-product.dto';
import { Category } from 'src/categories/category.model';
import { Op } from 'sequelize';
import { FileModel } from 'src/files/file.model';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product) private readonly productRepository: typeof Product,
    @InjectModel(FileModel) private readonly fileRepository: typeof FileModel,
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

    if (dto.imageIds?.length) {
      await product.$set('images', dto.imageIds);
    }

    return this.getProductById(product.id);
  }

  async updateProduct(dto: UpdateProductDto): Promise<Product> {
    const existingProduct = await this.productRepository.findByPk(dto.id);

    if (!existingProduct) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    await existingProduct.update({
      title: dto.title,
      description: dto.description,
      price: dto.price,
      categoryId: dto.categoryId,
      imagesOrder: dto.imageIds,
    });

    if (dto.imageIds?.length) {
      await existingProduct.$set('images', dto.imageIds);
    }

    return this.getProductById(existingProduct.id);
  }

  async getProductById(productId: number): Promise<Product> {
    return this.productRepository.findByPk(productId, {
      include: [
        {
          model: FileModel,
          as: 'images',
          through: { attributes: [] },
        },
        Category,
      ],
      attributes: { exclude: ['categoryId'] },
    });
  }

  async findAllProducts(
    pageNumber = 1,
    limit = 10,
    categoryId?: number,
    search?: string,
    sort: string = 'id',
    order: string = 'ASC',
  ) {
    const offset = (pageNumber - 1) * limit;

    const whereCondition: any = {};
    if (categoryId) whereCondition.categoryId = categoryId;
    if (search) {
      whereCondition[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const validSortColumns = ['id', 'title', 'price', 'createdAt', 'updatedAt'];
    if (!validSortColumns.includes(sort)) sort = 'id';
    order = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const { rows: items, count: totalItems } =
      await this.productRepository.findAndCountAll({
        where: whereCondition,
        limit,
        offset,
        order: [[sort, order]],
        include: [
          { model: FileModel, as: 'images' },
          { model: Category },
        ],
        attributes: { exclude: ['categoryId'] },
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
