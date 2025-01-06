import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  ParseIntPipe,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ShoppingCartService } from './shopping-cart.service';
import { AddProductToCartDto } from './dto/add-product-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ShoppingCartDto } from './dto/shopping-cart.dto';
import { RolesGuard } from 'src/auth/roles-auth.guard';
import { Roles } from 'src/auth/roles-auth.decorator';

@ApiTags('shopping-cart')
@Controller('shopping-cart')
@UseGuards(JwtAuthGuard)
export class ShoppingCartController {
  constructor(private readonly shoppingCartService: ShoppingCartService) {}

  @Post()
  @ApiOperation({ summary: 'Add a product to the cart' })
  @ApiBody({ type: AddProductToCartDto })
  @ApiResponse({ status: 201, description: 'Product added to the cart successfully.' })
  async addProductToCart(@Body() addProductToCartDto: AddProductToCartDto) {
    return await this.shoppingCartService.addProductToCart(addProductToCartDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a product from the cart' })
  @ApiResponse({ status: 200, description: 'Product removed from the cart successfully.' })
  async removeProductFromCart(@Param('id', ParseIntPipe) productId: number, @Body() body: UpdateCartItemDto) {
    return await this.shoppingCartService.removeProductFromCart(productId, body.quantity);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiResponse({ status: 200, description: 'Cart item updated successfully.' })
  async updateCartItem(@Param('id', ParseIntPipe) productId: number, @Body() body: UpdateCartItemDto) {
    return await this.shoppingCartService.updateCartItem(productId, body.quantity);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear the shopping cart' })
  @ApiResponse({ status: 200, description: 'Shopping cart cleared successfully.' })
  async clearCart() {
    return await this.shoppingCartService.clearCart();
  }

  @Get(':id?')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get shopping cart by user ID for admin or for logged-in user' })
  @ApiResponse({
    status: 200,
    description: 'Returned the shopping cart for the user.',
    type: ShoppingCartDto,
  })
  async getShoppingCart(@Req() req: any, @Param('id') id?: number): Promise<ShoppingCartDto> {
    const userId = id || req.user.id;
    if (!req.user.roles.includes('admin') && id && req.user.id !== id) {
      throw new ForbiddenException("You are not allowed to access another user's shopping cart.");
    }
    return await this.shoppingCartService.getShoppingCart(userId);
  }
}
