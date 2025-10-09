/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Configure Swagger API documentation
  const apiConfig = new DocumentBuilder()
    .setTitle('Orbbit Backend API')
    .setDescription('Orbbit Invoice Finance - Backend API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('App', 'Application health and info endpoints')
    .build();

  try {
    const apiDocument = SwaggerModule.createDocument(app, apiConfig, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
    });

    SwaggerModule.setup('api/docs', app, apiDocument, {
      jsonDocumentUrl: 'api/docs/swagger.json',
      explorer: true,
      customSiteTitle: 'Orbbit Backend API',
      swaggerOptions: { persistAuthorization: true },
    });

    Logger.log(
      `📚 Swagger documentation available at: http://localhost:${process.env.PORT || 9000}/api/docs`
    );
  } catch (err) {
    console.warn(
      'Swagger generation failed. Skipping Swagger setup. Error:',
      err instanceof Error ? err.message : err,
    );
  }

  const port = process.env.PORT || 9000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
