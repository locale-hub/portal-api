import * as MailService from './mail.service';
import {UserRepository} from '../../data/repositories/user.repository';
import {User} from '../../data/models/user.model';
import jwt from 'jsonwebtoken';
import {UserInvitation} from '../../data/models/userInvitation.model';
import moment from 'moment';
import {config} from '../../configs/config';
import {generateEmailConfirmationToken} from '../middlewares/auth.middleware';
import {EmailStatus} from '../../data/enums/EmailStatus.enum';
import {ApiException} from '../../data/exceptions/api.exception';
import {ErrorCode} from '../../data/enums/error-code.enum';

const userRepository = new UserRepository();

/**
 * Create a new user
 * @param {string} name Name of the user
 * @param {string} email Email of the user
 * @param {string} password Encrypted password of the user
 * @param {string} salt Password salt
 * @return {User|null} The newly created user, null if not created
 */
export const createUser = async (name :string, email: string, password: string, salt: string): Promise<User> => {
  return await userRepository.insert(name, email, password, salt);
};

/**
 * Find a list of users
 * @param {string[]} ids List of user Ids to find
 * @return {User[]} List of found users, non existing users are omitted
 */
export const findIn = async (ids: string[]): Promise<User[]> => {
  return await userRepository.findIn(ids);
};

export const updateUser = async (current: User, updated: User): Promise<User> => {
  const user = await userRepository.findByEmail(current.primaryEmail);

  const newEmails = updated.emails
    .filter((data) => EmailStatus.PENDING === data.status)
    .map((data) => {
      data.createdAt = moment().utc().toString();
      return data;
    });

  for (const {email} of newEmails) {
    if (await userRepository.emailExists(email)) {
      throw new ApiException({
        message: `Email '${email}' already exists.`,
        code: ErrorCode.userEmailAlreadyExists,
        statusCode: 403,
      });
    }
  }

  user.name = updated.name;
  user.primaryEmail = updated.primaryEmail;
  user.emails = updated.emails;

  newEmails.forEach((mail) => {
    const token = generateEmailConfirmationToken({
      email: mail.email,
      createdAt: mail.createdAt,
    });
    const link = `${config.app.website.domain}/validate-email/${token}`;
    MailService.send(
      mail.email,
      'Confirm your email',
      'auth.email-confirmation',
      {
        userName: user.name,
        link,
      },
    );
  });

  return await userRepository.update(current.id, user);
};

export const validateNewUserEmail = async (current: User, body: { token: string }): Promise<User> => {
  const user = await userRepository.findByEmail(current.primaryEmail);

  const invitation = (jwt.decode(body.token) as any).invitation as UserInvitation;

  const hasEmail = user.emails
    .some((e) => e.email === invitation.email);
  const isExpired = moment(invitation.createdAt)
    .add(15, 'minutes')
    .isBefore(moment());

  if (!hasEmail) {
    throw new ApiException({
      message: 'The invitation is not linked to your account',
      code: ErrorCode.userInvitationInvalidAccount,
      statusCode: 403,
    });
  } else if (isExpired) {
    throw new ApiException({
      message: 'Invitation expired, please try again',
      code: ErrorCode.userInvitationExpired,
      statusCode: 410,
    });
  }

  user.emails = user.emails.map((e) => {
    if (e.email === invitation.email) {
      e.status = EmailStatus.VALID;
    }
    return e;
  });

  return await userRepository.update(current.id, user);
};
