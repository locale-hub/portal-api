import express, {Application, NextFunction, Request, Response} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

import appsRoutes from './controllers/apps.controller';
import authRoutes from './controllers/auth.controller';
import bundleRoutes from './controllers/bundle.controller';
import commitsRoutes from './controllers/commits.controller';
import localesRoutes from './controllers/locales.controller';
import manifestRoutes from './controllers/manifests.controller';
import meRoutes from './controllers/me.controller';
import notificationRoutes from './controllers/notifications.controller';
import organizationRoutes from './controllers/organizations.controller';
import organizationUsersRoutes from './controllers/organizationUsers.controller';
import projectsRoutes from './controllers/project.controller';
import projectUsersRoutes from './controllers/projectUser.controller';
import usersRoutes from './controllers/users.controller';
import {config} from './configs/config';
import {sendError} from './logic/helpers/sendError.helper';
import {ErrorCode} from './data/enums/error-code.enum';
import {authenticate} from './logic/middlewares/auth.middleware';
import {validateUserAccessToOrg} from './logic/middlewares/validateUserAccessToOrg.middleware';
import {validateUserAccessToProject} from './logic/middlewares/validateUserAccessToProject.middleware';
import {ApiException} from './data/exceptions/api.exception';

const fallbackSlowDown = slowDown({
  windowMs: 604800000, // 7 days
  delayAfter: 1, // slow after 1st request
  delayMs: 1000, // Add 1sec delay for each additional request
});

const expressApp: Application = express();

const apiRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 500, // max requests per IP
});

if (config.features.sentry) {
  Sentry.init({
    dsn: config.sentry.uri,
    environment: config.app.environment,
    release: config.app.version,
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({tracing: true}),
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({app: expressApp}),
    ],
    tracesSampleRate: 1.0,
  });

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  expressApp.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  expressApp.use(Sentry.Handlers.tracingHandler());

  // API is behind a proxy on PRD
  expressApp.enable('trust proxy');
}

expressApp.use(express.json());
expressApp.use(cors({
  origin: [
    config.security.cors.origin,
  ],
}));
expressApp.use(helmet());

// Global Rate limiter on Portal API
expressApp.use(apiRateLimiter);

/**
 * HealthCheck route. Returns the status and version of the API
 */
expressApp.get('/', (req: express.Request, res: express.Response) => res.json());
expressApp.get('/v1', (req: express.Request, res: express.Response) => res.json({
  status: 'ok',
  api: 'portal',
  version: config.app.version,
}));

/**
 * Authentication related routes
 */
expressApp.use(
  '/v1/auth',
  authRoutes,
);

/**
 * Locales related routes
 */
expressApp.use(
  '/v1/locales',
  authenticate,
  localesRoutes,
);

/**
 * Current user related routes
 */
expressApp.use(
  '/v1/me',
  authenticate,
  meRoutes,
);

/**
 * Notifications related routes
 */
expressApp.use(
  '/v1/notifications',
  authenticate,
  notificationRoutes,
);

/**
 * Organization users related routes
 */
expressApp.use(
  '/v1/organizations/:organizationId/users',
  authenticate, validateUserAccessToOrg,
  organizationUsersRoutes,
);

/**
 * Organization related routes
 */
expressApp.use(
  '/v1/organizations',
  authenticate,
  organizationRoutes,
);

/**
 * Project's Apps related routes
 */
expressApp.use(
  '/v1/projects/:projectId/apps',
  authenticate, validateUserAccessToProject,
  appsRoutes,
);

/**
 * Project's Bundle related routes
 */
expressApp.use(
  '/v1/projects/:projectId/bundles',
  authenticate, validateUserAccessToProject,
  bundleRoutes,
);

/**
 * Project's Commits related routes
 */
expressApp.use(
  '/v1/projects/:projectId/commits',
  authenticate, validateUserAccessToProject,
  commitsRoutes,
);

/**
 * Project's Manifest related routes
 */
expressApp.use(
  '/v1/projects/:projectId/manifests',
  authenticate, validateUserAccessToProject,
  manifestRoutes,
);

/**
 * Project's Users related routes
 */
expressApp.use(
  '/v1/projects/:projectId/users',
  authenticate, validateUserAccessToProject,
  projectUsersRoutes,
);

/**
 * Projects related routes
 */
expressApp.use(
  '/v1/projects',
  authenticate,
  projectsRoutes,
);

/**
 * Users related routes
 */
expressApp.use(
  '/v1/users',
  authenticate,
  usersRoutes,
);

/**
 * 404 route
 */
expressApp.use(fallbackSlowDown, function(req: Request, res: Response) {
  return sendError(res, new ApiException({
    statusCode: 404,
    code: ErrorCode.routeNotFound,
    message: 'Route not found',
  }));
});

if (config.features.sentry) {
  expressApp.use(Sentry.Handlers.errorHandler());
}

/**
 * Error Fallback route. Hide the error under a generic message for user and keeps the log.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
expressApp.use(function(err: Error, req: Request, res: Response, _next: NextFunction) {
  return sendError(res, err);
});

export const app = expressApp;
