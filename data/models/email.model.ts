import {EmailStatus} from '../enums/EmailStatus.enum';

export interface Email {
  email: string;
  status: EmailStatus;
  createdAt: string;
}
