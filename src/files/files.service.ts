import { Injectable } from '@nestjs/common';
// import AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { writeFile } from 'fs/promises';
import * as path from 'path';
import { File } from 'multer';

@Injectable()
export class FilesService {
  // private s3: AWS.S3;

  constructor() {
    // this.s3 = new AWS.S3({
    //   accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
    //   secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
    // });
  }

  async uploadFile(file: File): Promise<string> {
    const filePath = path.join('./uploads', file.originalname);
    await writeFile(filePath, file.buffer); // Использование Promise-based функции writeFile из модуля 'fs/promises'
    return filePath;
  }

  // async uploadFileToS3(file: File): Promise<AWS.S3.ManagedUpload.SendData> {
  //   const uploadParams = {
  //     Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
  //     Key: `${Date.now()}-${file.originalname}`,
  //     Body: file.buffer,
  //   };

  //   return this.s3.upload(uploadParams).promise();
  // }
}
