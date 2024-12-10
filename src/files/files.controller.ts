import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { File } from 'multer';

@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: File) {
    // Можно переключать между локальным сохранением и S3 в зависимости от переменной окружения или конфигурации
    const result = await this.filesService.uploadFile(file); // или this.filesService.uploadFileToS3(file);
    return { path: result };
  }
}
