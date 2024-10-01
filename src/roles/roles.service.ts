import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Role } from './roles.model';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
    constructor(@InjectModel(Role) private roleRepository: typeof Role) {}

    async createRole(dto: CreateRoleDto) {
        if (!dto.value || !dto.description) {
            throw new HttpException('Role is incorrect', HttpStatus.BAD_REQUEST);
        }
        try {
            const role = await this.roleRepository.create(dto);
            return role;
        } catch (e) {
            throw new HttpException('Role is already exist or incorrect', HttpStatus.BAD_REQUEST);
        }
    }

    async getRoleByValue(value: string) {
        const role = await this.roleRepository.findOne({ where: { value } });

        return role;
    }
}
