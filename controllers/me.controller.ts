import {Request, Response, Router as createRouter} from 'express';
import rateLimit from 'express-rate-limit';

import {generateAuthToken} from '../logic/middlewares/auth.middleware';
import {UserRepository} from '../data/repositories/user.repository';
import {validateRequest} from '../logic/middlewares/validateRequest.middleware';
import {updateUserSchema} from '../data/requests/updateUser.request';
import {updateUserPasswordSchema} from '../data/requests/updateUserPassword.request';
import {sendError} from '../logic/helpers/sendError.helper';
import {ErrorCode} from '../data/enums/error-code.enum';
import {updateUser, validateNewUserEmail} from '../logic/services/user.service';
import {validateEmailSchema} from '../data/requests/validateEmail.request';
import {getOrganizationProjects, getUsersOrganizations} from '../logic/services/organization.service';
import {User} from '../data/models/user.model';
import {ApiException} from '../data/exceptions/api.exception';
import argon2 from 'argon2';
import {config} from '../configs/config';
import {getProjectsTranslationProgress} from '../logic/services/project.service';

const editPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // max requests per IP
  skipSuccessfulRequests: true,
});

const router = createRouter({mergeParams: true});
const userRepository = new UserRepository();

const secret = Buffer.from(config.security.password.secret, 'utf8');

/**
 * Edit current users information
 */
router.put(
  '/',
  editPasswordRateLimiter, validateRequest(updateUserSchema),
  async function(req: Request, res: Response) {
    try {
      const user = await updateUser(req.user, req.body.user);

      const token = generateAuthToken({
        user,
        lastLogin: req.jwt.lastLogin,
      });

      res.json({
        token,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

/**
 * Get users organizations
 */
router.get(
  '/dashboard',
  async function(req: Request, res: Response) {
    try {
      const user = req.user as User;

      const organizations = await getUsersOrganizations(user);

      const projects = (await getOrganizationProjects(organizations.map((o) => o.id)))
        .filter((project) => project.users.map((u) => u.id).includes(user.id));

      const progress = await getProjectsTranslationProgress(projects.map((project) => project.id));


      res.json({
        organizations,
        projects,
        progress,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

/**
 * Update current user password
 */
router.put(
  '/password',
  validateRequest(updateUserPasswordSchema),
  async function(req: Request, res: Response) {
    try {
      const user = await userRepository.find(req.user.id);
      const passwordCorrect = await argon2.verify(user.password, req.body.old, {
        type: argon2.argon2id,
        salt: Buffer.from(user.passwordSalt, 'utf8'),
        secret,
      });
      if (!passwordCorrect) {
        return sendError(res, new ApiException({
          statusCode: 401,
          code: ErrorCode.userPasswordMismatch,
          message: 'Password mismatch',
        }));
      }

      const password = await argon2.hash(req.body.new, {
        type: argon2.argon2id,
        salt: Buffer.from(user.passwordSalt, 'utf8'),
        secret,
      });
      await userRepository.updatePassword(user.id, password);

      res.status(204).send();
    } catch (error) {
      sendError(res, error);
    }
  });


/**
 * Edit current users information
 */
router.post(
  '/validate-email',
  validateRequest(validateEmailSchema),
  async function(req: Request, res: Response) {
    try {
      const user = await validateNewUserEmail(req.user, req.body);

      const token = generateAuthToken({
        user,
        lastLogin: req.jwt.lastLogin,
      });

      res.json({
        token,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

// TODO: Delete user endpoint

export default router;
