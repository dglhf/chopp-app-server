import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from 'src/products/product.model';
import { User } from 'src/users/users.model';
import { ShoppingCart } from './shopping-cart.model';
import { Transaction } from 'sequelize';
import { ShoppingCartDto } from './dto/shopping-cart.dto';
import { ShoppingCartItem } from './shopping-cart-item.model';

@Injectable()
export class ShoppingCartService implements OnModuleInit {
  private readonly logger = new Logger(ShoppingCartService.name);

  constructor(
    @InjectModel(ShoppingCart) private shoppingCartModel: typeof ShoppingCart,
    @InjectModel(ShoppingCartItem)
    private shoppingCartItemModel: typeof ShoppingCartItem,
    @InjectModel(Product) private productModel: typeof Product,
    @InjectModel(User) private userModel: typeof User,
  ) {}

  async onModuleInit() {
    const users = await this.userModel.findAll();
    const cartUserIds = (
      await this.shoppingCartModel.findAll({ attributes: ['userId'] })
    )
      .map((cart) => cart.userId)
      .filter((userId) => userId != null);

    const usersWithoutCart = users.filter(
      (user) => !cartUserIds.includes(user.id),
    );

    for (const user of usersWithoutCart) {
      await this.shoppingCartModel.create({
        userId: user.id,
        items: [],
        totalPrice: 0,
      });
      this.logger.log(`🚀 Created shopping cart for user ID: ${user.id}`);
    }

    if (usersWithoutCart.length > 0) {
      this.logger.log(
        `✅ Added shopping carts for ${usersWithoutCart.length} users.`,
      );
    } else {
      this.logger.log(`✅ All users already have shopping carts.`);
    }
  }

  async getShoppingCart(userId: number): Promise<ShoppingCartDto> {
    const cart = await this.shoppingCartModel.findOne({
      where: { userId },
      include: [
        {
          model: ShoppingCartItem,
          include: [{ model: Product }],
        },
      ],
    });

    if (!cart) {
      throw new NotFoundException('Shopping cart not found');
    }

    const items = cart.items.map((item) => ({
      productId: item.productId,
      productName: item.product.title,
      price: item.product.price,
      quantity: item.quantity,
      totalPrice: item.quantity * item.product.price,
    }));

    

    return { items, totalPrice: cart.totalPrice, quantity: cart.quantity };
  }

  async addProductsToCart(
    userId: number,
    items: { productId: number; quantity: number }[],
  ): Promise<any> {
    const transaction = await this.shoppingCartModel.sequelize.transaction();

    try {
      let cart = await this.shoppingCartModel.findOne({
        where: { userId },
        transaction,
      });

      if (!cart) {
        cart = await this.shoppingCartModel.create(
          {
            userId,
            totalPrice: 0,
            quantity: 0, // Инициализируем количеством 0 при создании новой корзины
          },
          { transaction },
        );
      }

      let totalQuantity = 0; // Общее количество товаров для обновления
      let totalPrice = 0; // Общая стоимость товаров для обновления

      await this.shoppingCartItemModel.destroy({
        where: { shoppingCartId: cart.id },
        transaction,
      });

      for (const item of items) {
        const product = await this.productModel.findByPk(item.productId, {
          transaction,
        });
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found`,
          );
        }

        await this.shoppingCartItemModel.create(
          {
            productId: item.productId,
            quantity: item.quantity,
            shoppingCartId: cart.id,
          },
          { transaction },
        );

        totalQuantity += item.quantity; // Суммируем количество
        totalPrice += item.quantity * product.price; // Суммируем стоимость
      }

      // Обновляем общее количество и общую стоимость корзины
      cart.quantity = totalQuantity;
      cart.totalPrice = totalPrice;
      await cart.save({ transaction });

      await transaction.commit();
      return { message: 'Shopping cart updated successfully.' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // async removeProductFromCart(userId: number, productId: number): Promise<any> {
  //   const transaction = await this.shoppingCartModel.sequelize.transaction();

  //   try {
  //     const cart = await this.shoppingCartModel.findOne({
  //       where: { userId },
  //       transaction,
  //     });

  //     if (!cart) {
  //       throw new NotFoundException('Shopping cart not found');
  //     }

  //     const cartItem = await this.shoppingCartItemModel.findOne({
  //       where: { productId, shoppingCartId: cart.id },
  //       transaction,
  //     });

  //     if (!cartItem) {
  //       throw new NotFoundException(
  //         `Product with ID ${productId} not found in cart`,
  //       );
  //     }

  //     // Уменьшаем общее количество на количество удаляемого товара
  //     cart.quantity -= cartItem.quantity;
  //     await cartItem.destroy({ transaction });
  //     await cart.save({ transaction });

  //     await transaction.commit();
  //     return { message: 'Product removed from cart successfully' };
  //   } catch (error) {
  //     await transaction.rollback();
  //     throw error;
  //   }
  // }

  async clearCart(userId: number): Promise<any> {
    const transaction = await this.shoppingCartModel.sequelize.transaction();

    try {
      const cart = await this.shoppingCartModel.findOne({
        where: { userId },
        transaction,
      });

      if (!cart) {
        throw new NotFoundException('Shopping cart not found');
      }

      await this.shoppingCartItemModel.destroy({
        where: { shoppingCartId: cart.id },
        transaction,
      });

      // Обнуляем общее количество и стоимость
      cart.totalPrice = 0;
      cart.quantity = 0;
      await cart.save({ transaction });

      await transaction.commit();
      return { message: 'Shopping cart cleared successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
