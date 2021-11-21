
export const config = {
  features: { // features to be enabled or not
    sdk: 'true' === process.env.LH_FEATURES_SDK ?? false,
    sentry: 'true' === process.env.LH_FEATURES_SENTRY ?? false,
  },
  app: {
    environment: process.env.LH_APP_ENVIRONMENT ?? 'development',
    version: '2.0.0',
    port: 3000, // configurable via docker exposed port
    website: {
      domain: process.env.LH_APP_DOMAIN ?? 'http://host.docker.internal:4200',
      routes: {
        login: '/login',
        passwordReset: '/password-reset',
      },
    },
  },
  database: {
    name: process.env.LH_DB_NAME ?? 'locale-hub',
    uri: process.env.LH_DB_URI ?? 'mongodb://lh-user:lh-password@host.docker.internal:27017',
  },
  email: {
    from: process.env.LH_EMAIL_FROM ?? '',
    host: process.env.LH_EMAIL_HOST ?? '',
    port: parseInt(process.env.LH_EMAIL_PORT ?? '587'),
    secure: 'true' === process.env.LH_EMAIL_SECURE ?? false,
    auth: {
      user: process.env.LH_EMAIL_USER ?? '',
      password: process.env.LH_EMAIL_PASSWORD ?? '',
    },
    resources: {
      html: './resources/emails/html/',
      text: './resources/emails/text/',
    },
  },
  sdk: { // if features.sdk = true
    redis: {
      uri: process.env.LH_REDIS_URI ?? 'redis://host.docker.internal:6379/0',
    },
  },
  security: {
    cors: {
      origin: process.env.LH_APP_DOMAIN ?? 'http://host.docker.internal:4200',
    },
    jwt: {
      expiresIn: '1d', // seconds or string [zeit/ms](https://github.com/zeit/ms.js)
      secret: process.env.LH_SECURITY_JWT_SECRET ?? '',
    },
    password: {
      forbiddenList: './resources/files/passwords.txt',
      expirationInDays: 31,
      minLength: 8,
      secret: process.env.LH_SECURITY_PASSWORD_SECRET ?? '',
      saltLength: 16,
    },
  },
  sentry: { // if features.sentry = true
    uri: process.env.LH_SENTRY_URI,
  },
};
