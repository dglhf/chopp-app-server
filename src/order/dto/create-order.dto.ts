import { ApiProperty } from '@nestjs/swagger';
import { ShoppingCartItemDto } from 'src/shopping-cart/dto/shopping-cart-item.dto';
import { ShoppingCartItem } from 'src/shopping-cart/shopping-cart-item.model';

export class CreateOrderDto {
  @ApiProperty({
    example: 'http://example.com/returnUrl',
    description: 'URL для возврата пользователя после оплаты',
  })
  returnUrl: string;
}
