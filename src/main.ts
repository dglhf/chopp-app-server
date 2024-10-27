import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const DEFAULT_API_PREFIX = 'api';

async function bootstrap() {
  const PORT = process.env.PORT || 5000;
  const API_PREFIX = process.env.API_PREFIX || DEFAULT_API_PREFIX;
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: '*', allowedHeaders: '*' })

  app.setGlobalPrefix(API_PREFIX);

  const config = new DocumentBuilder()
    .setTitle("Chopp app's methods description")
    .setDescription('Note, when you need update info')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`/${API_PREFIX}/docs`, app, document);

  await app.listen(PORT, () => console.log(`server started on port === ${PORT}`));
}

bootstrap();
