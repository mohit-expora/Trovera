// Central configuration loaded by ConfigModule at startup.
// All values come from environment variables with safe defaults for development.
// Access values in services via: config.get<T>('key.nested')
export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'trovera',
    password: process.env.DB_PASSWORD || 'trovera',
    name: process.env.DB_NAME || 'trovera_db',
    // Controls Prisma connection pool size — appended to DATABASE_URL as connection_limit param
    poolSize: parseInt(process.env.DB_POOL_SIZE || '5', 10),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
  },

  session: {
    // Must be a long random string in production — used to sign the session cookie
    secret: process.env.SESSION_SECRET || 'trovera-session-secret-change-in-prod',
    maxAgeDays: parseInt(process.env.SESSION_MAX_AGE_DAYS || '7', 10),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },

  // SMTP disabled — re-enable when email sending is implemented
  // smtp: {
  //   host: process.env.SMTP_HOST || 'localhost',
  //   port: parseInt(process.env.SMTP_PORT || '1025', 10),
  //   username: process.env.SMTP_USERNAME || '',
  //   password: process.env.SMTP_PASSWORD || '',
  //   fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@trovera.app',
  //   fromName: process.env.SMTP_FROM_NAME || 'Trovera Library',
  //   tls: process.env.SMTP_TLS === 'true',
  // },

  // Comma-separated list of allowed CORS origins
  corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10),

  // Rate limiting disabled — re-enable when ThrottlerModule is re-enabled in AppModule
  // rateLimit: {
  //   perMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '60', 10),
  //   authPerMinute: parseInt(process.env.AUTH_RATE_LIMIT_PER_MINUTE || '5', 10),
  // },

  translation: {
    // DeepLX is tried first (self-hosted, free). LibreTranslate is the fallback.
    libreTranslateUrl: process.env.LIBRE_TRANSLATE_URL || '',
    deeplxUrl: process.env.DEEPLX_URL || '',
  },
});
