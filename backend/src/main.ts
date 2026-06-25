import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // cors: false — we configure CORS manually below for fine-grained origin control
  const app = await NestFactory.create(AppModule, { cors: false });

  const config = app.get(ConfigService);
  const port = config.get<number>('port', 8001);
  const env = config.get<string>('nodeEnv', 'development');

  // Sets security headers: X-Frame-Options, HSTS, X-Content-Type-Options, CSP, etc.
  // Replaces the old custom SecurityHeadersMiddleware
  app.use(helmet());

  // cookie-parser must run before express-session so session can read the sid cookie
  app.use(cookieParser());

  // Session stored in Redis — survives backend restarts, shared across multiple instances
  const redisUrl = config.get<string>('redis.url', 'redis://localhost:6379/0');
  const sessionSecret = config.get<string>('session.secret');
  const sessionMaxAgeDays = config.get<number>('session.maxAgeDays', 7);
  const redisClient = createClient({ url: redisUrl });
  await redisClient.connect();

  app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      secret: sessionSecret,
      // resave: false — don't re-save session to Redis on every request if nothing changed
      resave: false,
      // saveUninitialized: false — don't create a Redis entry until user actually logs in
      saveUninitialized: false,
      name: 'trovera_sid',
      cookie: {
        httpOnly: true,
        secure: 'auto',
        // Dev: SameSite=None — allows localhost frontend cross-origin to EC2
        // Prod: SameSite=Strict — same-domain only
        sameSite: env === 'production' ? 'strict' : 'none',
        maxAge: sessionMaxAgeDays * 24 * 60 * 60 * 1000,
      },
    }),
  );

  // CORS — only allow requests from explicitly listed origins
  const corsOrigins = config.get<string>('corsOrigins', 'http://localhost:3000');
  const originList = corsOrigins.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin — curl, mobile apps, server-to-server calls
      if (!origin || originList.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true, // Required for cookies to be sent cross-origin
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip properties not in the DTO
      transform: true,           // Auto-convert types (string → number, etc.)
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // RequestIdInterceptor runs first — attaches X-Request-ID to every response for tracing
  app.useGlobalInterceptors(new RequestIdInterceptor(), new TransformInterceptor());

  // Health endpoints are excluded so they're reachable at /health without the /api/v1 prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/readiness'],
  });

  // Ensure upload directory exists at startup
  const uploadDir = config.get<string>('uploadDir', './uploads');
  const resolvedUploadDir = path.resolve(uploadDir);
  if (!fs.existsSync(resolvedUploadDir)) {
    fs.mkdirSync(resolvedUploadDir, { recursive: true });
  }

  // Swagger only in development — not exposed in production
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
