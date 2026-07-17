import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  const apiPrefix = config.get<string>('API_PREFIX', 'api/v1');

  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health', 'health/(.*)'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(
    json({
      verify: (req, _res, buf) => {
        (req as { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(urlencoded({ extended: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Inova CRM AI API')
    .setDescription('NestJS API — tenant-aware CRM (Phase 4–5)')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-tenant-id', in: 'header' }, 'tenant')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const corsOrigins = config.get<string>(
    'CORS_ORIGINS',
    'http://127.0.0.1:9400,http://localhost:9400',
  );
  app.enableCors({
    origin: corsOrigins
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
  });

  await app.listen(port);
  console.log(`API listening on http://localhost:${port}/${apiPrefix}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}

void bootstrap();
