import 'reflect-metadata';

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { FarmBridgeIoAdapter } from './realtime/io.adapter';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Trims the default noise; anything worth seeing is logged deliberately.
    logger: ['error', 'warn', 'log'],
  });

  const config = app.get(ConfigService);
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  // Refuse to serve real traffic with the development payment provider: it
  // marks orders paid without any money moving.
  if (isProduction && config.get<string>('PAYMENT_PROVIDER') !== 'paynow') {
    throw new Error('Refusing to start in production with a non-production payment provider.');
  }

  app.use(helmet());

  // Explicit allowlist, never a wildcard: the app sends credentials, and
  // `origin: true` would reflect any caller's origin back as permitted.
  const origins = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.length > 0 ? origins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    maxAge: 600,
  });

  app.useWebSocketAdapter(new FarmBridgeIoAdapter(app, origins));

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      // Unknown fields are stripped and then rejected, so a client cannot set a
      // column the DTO never exposed — mass assignment closed at the door.
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      // Validation messages name the field but not the constraint internals in
      // production, so error responses do not describe the schema.
      disableErrorMessages: isProduction,
    }),
  );

  // X-Forwarded-For is only trustworthy behind a proxy we control. Trusting it
  // unconditionally lets any caller spoof their IP and defeat rate limiting.
  app.set('trust proxy', isProduction ? 1 : false);

  app.enableShutdownHooks();

  const port = Number(config.get<string>('PORT') ?? 3000);
  await app.listen(port, '0.0.0.0');

  logger.log(`FarmBridge API listening on port ${port}`);
  logger.log(`Payment provider: ${config.get<string>('PAYMENT_PROVIDER', 'mock')}`);
  if (origins.length === 0) {
    logger.warn('CORS_ORIGINS is empty — browser clients will be refused.');
  }
}

void bootstrap();
