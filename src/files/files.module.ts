import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FileModel } from './file.model';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
    SequelizeModule.forFeature([FileModel]),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
