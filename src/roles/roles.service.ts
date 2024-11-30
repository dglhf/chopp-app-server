import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Role } from './roles.model';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(@InjectModel(Role) private roleRepository: typeof Role) {}

  async onModuleInit() {
    const roles = await this.roleRepository.findAll();
    const roleNames = roles.map((item) => item.value);

    if (!roleNames.includes('ADMIN')) {
      this.roleRepository.create({
        value: 'ADMIN',
        description: 'Administrator role',
      });

      this.logger.log('Created default role: ADMIN');
    }

    if (!roleNames.includes('USER')) {
      this.roleRepository.create({
        value: 'USER',
        description: 'User role',
      });

      this.logger.log('Created default role: USER');
    }
  }

  async createRole(dto: CreateRoleDto) {
    if (!dto.value || !dto.description) {
      throw new HttpException('Role is incorrect', HttpStatus.BAD_REQUEST);
    }
    try {
      const role = await this.roleRepository.create(dto);
      return role;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      throw new HttpException(
        'Role is already exist or incorrect',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getRoleByValue(value: string) {
    const role = await this.roleRepository.findOne({ where: { value } });

    return role;
  }
}
