import Joi from 'joi';
import {config} from '../../configs/config';

export const createUserSchema = Joi.object({
  user: {
    name: Joi
      .string()
      .min(3)
      .max(32)
      .required(),
    primaryEmail: Joi
      .string()
      .email()
      .required(),
    password: Joi
      .string()
      .min(config.security.password.minLength)
      .required(),
  },
}).options({
  abortEarly: false,
  allowUnknown: true,
});
