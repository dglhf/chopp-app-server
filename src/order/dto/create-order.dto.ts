import { ApiProperty } from '@nestjs/swagger';
import { ShoppingCartItemDto } from 'src/shopping-cart/dto/shopping-cart-item.dto';
import { ShoppingCartItem } from 'src/shopping-cart/shopping-cart-item.model';

export class CreateOrderDto {
  @ApiProperty({
    type: [ShoppingCartItemDto],
    description: 'List of items in the shopping cart',
    example: [
      { productId: 1, quantity: 2 }, { productId: 2, quantity: 3 }
    ]
  })
  items: ShoppingCartItemDto[];

  @ApiProperty({
    example: 3000,
    description: 'Total price of all items in the shopping cart',
  })
  totalPrice: number;

  @ApiProperty({
    example: 'http://example.com',
    description: 'Return URL',
  })
  returnUrl

  @ApiProperty({
    example: 30,
    description: 'Quantity of all items in the shopping cart',
  })
  quantity: number;
}
