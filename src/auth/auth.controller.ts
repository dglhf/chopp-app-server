import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { expireParseByHours } from 'src/shared/utils';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}
    @Post('/login')
    async login(@Body() userDto: CreateUserDto, @Res({ passthrough: true }) response) {
        const data = await this.authService.login(userDto);
        response.cookie('refreshToken', data.refreshToken, { maxAge: expireParseByHours(process.env.JWT_REFRESH_EXPIRATION), httpOnly: true });
        return data;
    }

    @Post('/registration')
    async registration(@Body() userDto: CreateUserDto, @Res({ passthrough: true }) response) {
        const data = await this.authService.registration(userDto);
        response.cookie('refreshToken', data.refreshToken, { maxAge: expireParseByHours(process.env.JWT_REFRESH_EXPIRATION), httpOnly: true });
        return data;
    }
}
