/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Enable CORS for frontend applications
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://smb.orbbit.io', 'https://investor.orbbit.io']
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Configure Swagger API documentation
  const apiConfig = new DocumentBuilder()
    .setTitle('Orbbit Backend API')
    .setDescription('Orbbit Web3 Invoice Financing Platform - Backend API Documentation\n\nServes offchain data for SMB and Investor frontend applications.')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'Email OTP authentication endpoints')
    .addTag('App', 'Application health and info endpoints')
    .addTag('SMB - Dashboard', 'SMB dashboard aggregate metrics')
    .addTag('SMB - Invoices', 'Invoice management for SMBs (CRUD operations)')
    .addTag('SMB - Organization', 'Organization profile and settings')
    .addTag('SMB - Payers', 'Payer companies for invoice creation')
    .addTag('Investor - Profile', 'Investor user profile and KYC status')
    .addTag('Investor - Marketplace', 'Available invoices for funding')
    .addTag('Investor - Portfolio', 'NFT positions and portfolio analytics')
    .addTag('Shared - Payers', 'Detailed payer information and performance')
    .addTag('Shared - Blockchain', 'NFT data and transaction history')
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
    `🚀 Application is running on: http://localhost:${port}/v1`
  );
}

bootstrap();
