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
import { ShoppingCartItem } from './shopping-cart-item.model';

@Injectable()
export class ShoppingCartService implements OnModuleInit {
  private readonly logger = new Logger(ShoppingCartService.name);

  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(ShoppingCart) private shoppingCartModel: typeof ShoppingCart,
    @InjectModel(ShoppingCartItem) private shoppingCartItemModel: typeof ShoppingCartItem,
    @InjectModel(Product) private productModel: typeof Product,
  ) {}

  async onModuleInit() {
    const users = await this.userModel.findAll();
    const cartUserIds = (await this.shoppingCartModel.findAll({ attributes: ['userId'] }))
                      .map(cart => cart.userId)
                      .filter(userId => userId != null); 

                      console.log('---users: ', users)
                      console.log('---cartUserIds: ', cartUserIds)

    const usersWithoutCart = users.filter(user => !cartUserIds.includes(user.id));


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

  async addProductToCart(dto: { productId: number; quantity: number }) {
    const product = await this.productModel.findByPk(dto.productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    let cartItem = await this.shoppingCartItemModel.findOne({
      where: { productId: dto.productId }
    });

    if (cartItem) {
      cartItem.quantity += dto.quantity;
    } else {
      cartItem = await this.shoppingCartItemModel.create({
        productId: dto.productId,
        quantity: dto.quantity,
        shoppingCartId: 1, // This should be fetched based on current user context
      });
    }

    await cartItem.save();
    return cartItem;
  }

  async removeProductFromCart(productId: number, quantity: number) {
    const cartItem = await this.shoppingCartItemModel.findOne({
      where: { productId }
    });

    if (!cartItem) {
      throw new NotFoundException(`Product with ID ${productId} not found in cart`);
    }

    if (cartItem.quantity > quantity) {
      cartItem.quantity -= quantity;
      await cartItem.save();
    } else {
      await cartItem.destroy();
    }

    return { message: 'Product removed from cart successfully' };
  }

  async updateCartItem(productId: number, quantity: number) {
    const cartItem = await this.shoppingCartItemModel.findOne({
      where: { productId }
    });

    if (!cartItem) {
      throw new NotFoundException(`Product with ID ${productId} not found in cart`);
    }

    cartItem.quantity = quantity;
    await cartItem.save();
    return cartItem;
  }

  async clearCart() {
    // This should use the cart ID from the current user context
    await this.shoppingCartItemModel.destroy({
      where: { shoppingCartId: 1 }
    });

    return { message: 'Shopping cart cleared successfully' };
  }

  async getShoppingCart(userId: number): Promise<any> {
    const cart = await this.shoppingCartModel.findOne({
      where: { userId },
      include: [{
        model: ShoppingCartItem,
        include: [Product]
      }]
    });

    if (!cart) {
      throw new NotFoundException('Shopping cart not found');
    }

    const items = cart.items.map(item => ({
      productId: item.productId,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity,
      totalPrice: item.quantity * item.product.price
    }));

    const totalPrice = items.reduce((acc, item) => acc + item.totalPrice, 0);

    return {
      items,
      totalPrice
    };
  }

}
