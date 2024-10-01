import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto, UserRO } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/users.model';
import { AuthDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        // поменять на passport js
        private jwtService: JwtService
    ) { }

    private async generateTokens(user: User) {
        const payload = { email: user.email, id: user.id, roles: user.roles };

        return {
            accessToken: this.jwtService.sign(payload, {
                expiresIn: process.env.JWT_ACCESS_EXPIRATION,
                secret: process.env.JWT_ACCESS_SECRET_HEX,
            }),
            refreshToken: this.jwtService.sign(payload, {
                expiresIn: process.env.JWT_REFRESH_EXPIRATION,
                secret: process.env.JWT_REFRESH_SECRET_HEX,
            }),
        }
    }

    private async checkValidityUser(authDto: AuthDto) {
        const user = await this.usersService.getUserByEmail(authDto.email);

        if (!user) {
            throw new UnauthorizedException({ message: 'User not found' });
        }
        const isPasswordsEquals = await bcrypt.compare(authDto.password, user.password);

        if (user && isPasswordsEquals) {
            return user;
        }

        throw new UnauthorizedException({ message: 'Password is not correct' });
    }

    async login(authDto: AuthDto) {
        const user = await this.checkValidityUser(authDto);
        return this.generateTokens(user);
    }

    async registration(userDto: CreateUserDto) {
        const candidate = await this.usersService.getUserByEmail(userDto.email);

        if (candidate) {
            throw new HttpException('User with this email already exist', HttpStatus.BAD_REQUEST);
        }

        const hashPassword = await bcrypt.hash(userDto.password, 5);

        const user = await this.usersService.createUser({ ...userDto, password: hashPassword });

        return this.generateTokens(user);
    }

    verifyToken(token: string, secret: string): UserRO {
        try {
            const payload = this.jwtService.verify(token, { secret });
            return payload;
        } catch (e) {
            return null;
        }
    }

    async refresh(refreshToken: string) {
        if (!refreshToken) {
            throw new UnauthorizedException({ message: 'Refresh token not found' });
        }

        const payload = this.verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET_HEX);

        if (!payload) {
            throw new UnauthorizedException({ message: 'Invalid refresh token' });
        }

        const user = await this.usersService.getUserById(payload.id);

        if (!user) {
            throw new UnauthorizedException({ message: 'Invalid user' });
        }

        return this.generateTokens(user);
    }

    async getUserByTokenPayload(accessToken: string) {
        try {
            const payload = this.verifyToken(accessToken, process.env.JWT_ACCESS_SECRET_HEX);
            const user = await this.usersService.getUserById(payload.id);

            return user;
        } catch (e) {
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
        }
    }
}
