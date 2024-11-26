import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  order: number;

  @ApiProperty()
  @IsString()
  title: string;
}
