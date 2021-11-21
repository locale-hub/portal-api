# Locale Hub - Portal API

## Project Architecture
- `configs`: App configuration file
- `controllers`: The API routes
- `data`: Contains the models
- `logic`: The main logic of the API
- `resources`: Other files required by the api
- `scripts`: standalone util scripts (eg: for `npm run deploy`)

## Build Docker Image
```shell
docker build -t locale-hub/portal-api:2.0.0 .
```

## Run Docker Image
```shell
docker run --rm -p 3000:3000 [--env-file .env] --name locale-hub-api locale-hub/portal-api:2.0.0
```

dotenv options
- **LH_FEATURES_SDK**: (boolean) Should SDK be enabled? default: `false`
- **LH_FEATURES_SENTRY**: (string) Should Sentry be enabled? default: `false`

- **LH_APP_ENVIRONMENT**: (string) Environment name. default `development`
- **LH_APP_DOMAIN**: (string) App domain. Used to generate links and CORS. default `http://host.docker.internal:4200`
- **LH_DB_NAME**: (string) Database name. default `locale-hub`
- **LH_DB_URI**: (string) Database uri. default `mongodb://lh-user:lh-password@host.docker.internal:27017`
- **LH_EMAIL_FROM**: (string) SMTP settings
- **LH_EMAIL_HOST**: (string) SMTP settings
- **LH_EMAIL_PORT**: (string) SMTP settings
- **LH_EMAIL_SECURE**: (boolean) SMTP settings
- **LH_EMAIL_USER**: (string) SMTP settings
- **LH_EMAIL_PASSWORD**: (string) SMTP settings
- **LH_REDIS_URI**: (string) Mandatory if feature enabled, Redis uri. default `redis://host.docker.internal:6379/0`
- **LH_SECURITY_JWT_SECRET**: (string) JWT secret, to be provided
- **LH_SECURITY_PASSWORD_SECRET**: (string) JWT secret, to be provided
- **LH_SENTRY_URI**: (string) Mandatory if feature enabled, Sentry uri

## Run MongoDB
```shell
docker run --name locale-hub-mongodb -p 27017:27017 -d mongo \
  -e MONGO_INITDB_ROOT_USERNAME=lh-user \
  -e MONGO_INITDB_ROOT_PASSWORD=lh-password
```

## Run Redis
```shell
docker run --name locale-hub-redis -d redis
```
