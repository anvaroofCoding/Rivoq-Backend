import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 5001;

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
  });

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

  await app.listen(port, () => {
    console.log(
      `The Rivoq project's server successfully started on port: ${port} || Swagger: http://localhost:${port}/api-docs`,
    );
  });
}

await bootstrap();
