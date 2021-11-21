import {UserRoles} from '../enums/user-roles.enum';
import {Email} from './email.model';

export interface User {
  id: string;
  name: string;
  primaryEmail: string;
  emails: Email[];
  password: string;
  passwordSalt: string;
  role?: UserRoles;
  createdAt: string;
}
