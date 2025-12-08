import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { PORT } from './config/env.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('The Rivoq Online Education Platform Bakckend API documentation')
    .setDescription(
      'The Rivoq Online Education Platform Bakckend API documentation description',
    )
    .setVersion('1.0')
    .addSecurityRequirements('bearer', ['bearer'])
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await app.listen(PORT ?? 5001, () => {
    console.log(
      `The Rivoq project's server successfully started on port: ${PORT} || Swagger: http://localhost:${PORT}/api-docs`,
    );
  });
}

await bootstrap();
