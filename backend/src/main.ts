import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as session from 'express-session';
import { RedisStore } from 'connect-redis';
import Redis from 'ioredis';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  const config = app.get(ConfigService);
  const port = config.get<number>('port', 8001);
  const env = config.get<string>('nodeEnv', 'development');

  // Security headers
  app.use(helmet());

  // Cookie parser (must be before session)
  app.use(cookieParser());

  // Session middleware with Redis store
  const redisUrl = config.get<string>('redis.url', 'redis://localhost:6379/0');
  const sessionSecret = config.get<string>('session.secret');
  const sessionMaxAgeDays = config.get<number>('session.maxAgeDays', 7);
  const redisClient = new Redis(redisUrl);
  app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      name: 'trovera_sid',
      cookie: {
        httpOnly: true,
        secure: env === 'production',
        sameSite: 'strict',
        maxAge: sessionMaxAgeDays * 24 * 60 * 60 * 1000,
      },
    }),
  );

  // CORS
  const corsOrigins = config.get<string>('corsOrigins', 'http://localhost:3000');
  const originList = corsOrigins.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      // allow requests with no origin (curl, mobile apps, server-to-server)
      if (!origin || originList.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(new RequestIdInterceptor(), new TransformInterceptor());

  // API prefix (health routes are excluded so they live at /health, /health/readiness)
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/readiness'],
  });

  // Serve uploads as static files
  const uploadDir = config.get<string>('uploadDir', './uploads');
  const resolvedUploadDir = path.resolve(uploadDir);
  if (!fs.existsSync(resolvedUploadDir)) {
    fs.mkdirSync(resolvedUploadDir, { recursive: true });
  }

  // Swagger (dev only)
  if (env === 'development') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Trovera Library Management')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(port);
  console.log(`Trovera backend running on port ${port} [${env}]`);
}

bootstrap();
