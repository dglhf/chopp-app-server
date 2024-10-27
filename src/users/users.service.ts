import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import * as bcrypt from 'bcryptjs';
import { User } from './users.model';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User) private userRepository: typeof User,
        private roleService: RolesService,
    ) { }

    async createUser(dto: CreateUserDto) {
        const user = await this.userRepository.create(dto);
        const role = await this.roleService.getRoleByValue('USER');
        // role creation after user is created
        user.roles = [role];
        await user.$set('roles', [role.id]);

        return user;
    }

    async updateUser(payload: CreateUserDto, userModel: User) {
        // check if possible change to {...user, ...payload} spreading for conditions deleting
        if (payload?.email) {
            const candidate = await this.getUserByFieldName(payload?.email, 'email');

            if (candidate) {
                throw new HttpException('User with this email already exist', HttpStatus.BAD_REQUEST);
            }

            userModel.update({ email: payload.email });
        }
        if (payload?.password) {
            const hashPassword = await bcrypt.hash(payload.password, 5);
            userModel.update({ password: hashPassword });
        }
        if (payload?.fullName) {
            userModel.update({ fullName: payload.fullName });
        }
        if (payload?.phoneNumber) {
            userModel.update({ phoneNumber: payload.phoneNumber });
        }

        return userModel;
    }

    async getAllUsers(page = 1, limit = 10, search = '', sort = 'fullName', order = 'asc') {
        const offset = (page - 1) * limit;

        const where = search
            ? {
                [Op.or]: [
                    { fullName: { [Op.iLike]: `%${search}%` } },
                    { email: { [Op.iLike]: `%${search}%` } },
                    { phoneNumber: { [Op.iLike]: `%${search}%` } },
                ],
            }
            : {};

        const { rows: users, count: totalUsers } = await this.userRepository.findAndCountAll({
            where,
            limit: +limit,
            offset,
            order: [[sort, order.toUpperCase()]],
            include: { all: true },
            attributes: { exclude: ['password'] },
        });

        const totalPages = Math.ceil(totalUsers / limit);

        return {
            users,
            totalUsers,
            totalPages,
            page: Number(page),
        };
    }

    async getUserByFieldName(fieldValue: string | number, fieldName: string, withPassword: boolean = false) {
        const where = {
                [fieldName]: fieldValue,
        }

        /* 
            include: { all: true } для поиска всех значений,
            в том числе по ForeignKey в промежуточной базе данных
            в данном случае ролей
        */

        const user = await this.userRepository.findOne({ where, include: { all: true }, attributes: { exclude: withPassword ? [] : ['password'] } });

        return user;
    }
}
