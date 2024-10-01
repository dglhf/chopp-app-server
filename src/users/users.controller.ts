import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, UseGuards, UsePipes, Headers } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './users.model';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles-auth.guard';
import { Roles } from 'src/auth/roles-auth.decorator';
import { ValidationPipe } from 'src/pipes/validation.pipe';
import { AuthService } from 'src/auth/auth.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService, private authService: AuthService) {}

    /* 
        TODO: нужно будет убрать метод создания пользователя без авторизации,
        либо защитить role guard, только ADMIN
    */

    @ApiOperation({ summary: 'User creation' })
    @ApiResponse({ status: 200, type: User })
    @UsePipes(ValidationPipe)
    @Post()
    create(@Body() userDto: CreateUserDto) {
        return this.usersService.createUser(userDto);
    }

    @ApiOperation({ summary: 'roles: includes [ADMIN] Guarded! Getting all users' })
    @ApiResponse({ status: 200, type: [User] })
    @UseGuards(JwtAuthGuard)
    @Roles('ADMIN')
    @UseGuards(RolesGuard)
    @Get()
    getAll() {
        return this.usersService.getAllUsers();
    }

    @ApiOperation({ summary: 'Getting current user' })
    @ApiResponse({ status: 200, type: User })
    @UseGuards(JwtAuthGuard)
    @Get('/currentUser')
    async currentUser(@Headers() headers) {
        const authHeader = headers.authorization;

        const token = authHeader.split(' ')[1];

        const user = await this.authService.getUserByTokenPayload(token);

        if (!user?.id) {
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
        }

        return user;
    }

    @ApiOperation({ summary: 'Getting user by id' })
    @ApiResponse({ status: 200, type: User })
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getUser(@Param() params) {
        const { id } = params;

        if (!id) {
            throw new HttpException('Incorrect user id', HttpStatus.BAD_REQUEST);
        }

        const user = await this.usersService.getUserById(Number(params.id));

        if (!user?.id) {
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
        }

        return user;
    }
}
