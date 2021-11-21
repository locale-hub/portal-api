import {NotificationStatus} from '../enums/notification-status.enum';

interface NotificationUserStatus {
  id: string;
  status: NotificationStatus;
}

export interface Notification {
  id: string;
  title: string;
  text?: string;
  img?: string;
  link?: string;
  users: NotificationUserStatus[];
  createdAt: string;
}
