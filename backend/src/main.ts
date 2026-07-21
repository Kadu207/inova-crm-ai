import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  const apiPrefix = config.get<string>('API_PREFIX', 'api/v1');
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const swaggerEnabled =
    config.get<string>('SWAGGER_ENABLED') === 'true' || nodeEnv !== 'production';

  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
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

  const bodyLimit = config.get<string>('BODY_SIZE_LIMIT', '1mb');
  app.use(
    json({
      limit: bodyLimit,
      verify: (req, _res, buf) => {
        (req as { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Inova CRM AI API')
      .setDescription('NestJS API — tenant-aware CRM (Phase 4–5)')
      .setVersion('0.1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'x-tenant-id', in: 'header' }, 'tenant')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

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
  if (swaggerEnabled) {
    console.log(`Swagger docs at http://localhost:${port}/docs`);
  }
}

void bootstrap();
