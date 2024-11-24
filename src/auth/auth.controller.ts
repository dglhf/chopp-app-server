import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { expireParseByHours } from 'src/shared/utils';
import { AuthDto, RefreshDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('/login')
  async login(@Body() authDto: AuthDto, @Res({ passthrough: true }) response) {
    const data = await this.authService.login(authDto);
    response.cookie('refreshToken', data.refreshToken, {
      maxAge: expireParseByHours(process.env.JWT_REFRESH_EXPIRATION),
      httpOnly: true,
    });
    return data;
  }

  @Post('/registration')
  async registration(
    @Body() userDto: CreateUserDto,
    @Res({ passthrough: true }) response,
  ) {
    const data = await this.authService.registration(userDto);
    response.cookie('refreshToken', data.refreshToken, {
      maxAge: expireParseByHours(process.env.JWT_REFRESH_EXPIRATION),
      httpOnly: true,
    });
    return data;
  }

  @Post('/refresh')
  async refresh(
    @Body() { refreshToken }: RefreshDto,
    @Req() request,
    @Res({ passthrough: true }) response,
  ) {
    // can use it, if "refresh in cookies" case
    // const { refreshToken: cookiesRefreshToken } = request.cookies;

    const data = await this.authService.refresh(refreshToken);
    response.cookie('refreshToken', data.refreshToken, {
      maxAge: expireParseByHours(process.env.JWT_REFRESH_EXPIRATION),
      httpOnly: true,
    });

    return data;
  }
}
