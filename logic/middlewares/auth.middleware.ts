import jwt from 'jsonwebtoken';
import {NextFunction, Request, Response} from 'express';

import _ from 'lodash';
import {config} from '../../configs/config';
import {sendError} from '../helpers/sendError.helper';
import {ErrorCode} from '../../data/enums/error-code.enum';
import moment from 'moment';
import {JwtModel} from '../../data/models/jwt.model';
import {UserInvitation} from '../../data/models/userInvitation.model';
import {ApiException} from '../../data/exceptions/api.exception';
import {UserRepository} from '../../data/repositories/user.repository';

const userRepository = new UserRepository();
const secret = config.security.jwt.secret;

/**
 * Validate the submitted JsonWebToken
 * @param {Request} req Express Request
 * @param {Response} res Express Response
 * @param {NextFunction} next Express NextFunction
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token: string = req.headers['authorization'] as string;

  try {
    const jwtData = jwt.verify(token.replace('Bearer ', ''), secret) as JwtModel;

    if (!await userExists(jwtData.user.id)) {
      sendError(res, new ApiException({
        statusCode: 401,
        code: ErrorCode.userAccessUnauthorized,
        message: 'Unauthorized',
      }));
      return;
    }

    req.user = jwtData.user;
    req.jwt = jwtData;
    next();
  } catch (ex) {
    sendError(res, new ApiException({
      statusCode: 401,
      code: ErrorCode.userAccessUnauthorized,
      message: 'Unauthorized',
    }));
  }
};

/**
 * Generate a JsonWebToken from the user model
 * @param {JwtModel} bias data to use to generate a new JsonWebToken
 * @return {string} The new JsonWebToken
 */
export const generateAuthToken = (bias: JwtModel): string => {
  const lastLogin = undefined !== bias.lastLogin ? bias.lastLogin : moment(new Date()).toISOString();
  return jwt.sign(
    {
      user: _.omit(bias.user, ['_id', 'password', 'passwordSalt']),
      lastLogin,
    },
    secret,
    {
      expiresIn: config.security.jwt.expiresIn,
    },
  );
};

export const generateEmailConfirmationToken = (invitation: UserInvitation): string => {
  return jwt.sign(
    {
      invitation,
    },
    secret,
    {
      expiresIn: config.security.jwt.expiresIn,
    },
  );
};

/**
 * Decode a JsonWebToken to retrieve data
 * @param {string} token The JsonWebToken string representation
 * @return {JwtModel} The decoded object
 */
export const decodeAuthToken = (token: string): JwtModel => {
  return jwt.decode(
    token,
  ) as JwtModel;
};

/**
 * Confirm that the given userId exists in database
 * @param {string} userId The user id to validate
 * @return {boolean} true if user exists, false otherwise
 */
const userExists = async (userId: string): Promise<boolean> => {
  try {
    await userRepository.find(userId);
    return true;
  } catch (e) {
    return false;
  }
};
