import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from 'src/products/product.model';
import { User } from 'src/users/users.model';
import { ShoppingCart } from './shopping-cart.model';
import { Transaction } from 'sequelize';
import { ShoppingCartDto } from './dto/shopping-cart.dto';
import { ShoppingCartItem } from './shopping-cart-item.model';

@Injectable()
export class ShoppingCartService {
  constructor(
    @InjectModel(ShoppingCart) private shoppingCartModel: typeof ShoppingCart,
    @InjectModel(ShoppingCartItem)
    private shoppingCartItemModel: typeof ShoppingCartItem,
    @InjectModel(Product) private productModel: typeof Product,
    @InjectModel(User) private userModel: typeof User,
  ) {}

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

    const totalPrice = items.reduce((acc, item) => acc + item.totalPrice, 0);

    return { items, totalPrice };
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
          { userId, totalPrice: 0 },
          { transaction },
        );
      }

      for (const item of items) {
        const product = await this.productModel.findByPk(item.productId, {
          transaction,
        });
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found`,
          );
        }

        let cartItem = await this.shoppingCartItemModel.findOne({
          where: { productId: item.productId, shoppingCartId: cart.id },
          transaction,
        });

        if (cartItem) {
          cartItem.quantity += item.quantity;
          await cartItem.save({ transaction });
        } else {
          await this.shoppingCartItemModel.create(
            {
              productId: item.productId,
              quantity: item.quantity,
              shoppingCartId: cart.id,
            },
            { transaction },
          );
        }
      }

      await transaction.commit();
      return { message: 'Products added successfully.' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async removeProductFromCart(userId: number, productId: number): Promise<any> {
    const transaction = await this.shoppingCartModel.sequelize.transaction();

    try {
      const cart = await this.shoppingCartModel.findOne({
        where: { userId },
        transaction,
      });
      if (!cart) {
        throw new NotFoundException('Shopping cart not found');
      }

      const cartItem = await this.shoppingCartItemModel.findOne({
        where: { productId, shoppingCartId: cart.id },
        transaction,
      });

      if (!cartItem) {
        throw new NotFoundException(`Product with ID ${productId} not found in cart`);
      }

      await cartItem.destroy({ transaction });

      await transaction.commit();
      return { message: 'Product removed from cart successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }


  async updateCartItem(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<any> {
    const transaction = await this.shoppingCartModel.sequelize.transaction();

    try {
      const cart = await this.shoppingCartModel.findOne({
        where: { userId },
        transaction,
      });
      if (!cart) {
        await transaction.rollback();
        throw new NotFoundException('Shopping cart not found');
      }

      const cartItem = await this.shoppingCartItemModel.findOne({
        where: { productId, shoppingCartId: cart.id },
        transaction,
      });

      if (!cartItem) {
        await transaction.rollback();
        throw new NotFoundException(
          `Product with ID ${productId} not found in cart`,
        );
      }

      if (quantity > 0) {
        cartItem.quantity = quantity;
        await cartItem.save({ transaction });
      } else {
        await cartItem.destroy({ transaction });
      }

      await transaction.commit();
      return cartItem;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async clearCart(userId: number): Promise<any> {
    const transaction = await this.shoppingCartModel.sequelize.transaction();

    try {
      const cart = await this.shoppingCartModel.findOne({
        where: { userId },
        transaction,
      });
      if (!cart) {
        await transaction.rollback();
        throw new NotFoundException('Shopping cart not found');
      }

      await this.shoppingCartItemModel.destroy({
        where: { shoppingCartId: cart.id },
        transaction,
      });

      // Optionally reset the totalPrice to 0 if you are tracking this in the ShoppingCart model
      cart.totalPrice = 0;
      await cart.save({ transaction });

      await transaction.commit();
      return { message: 'Shopping cart cleared successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
