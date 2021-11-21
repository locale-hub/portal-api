import {ProjectUserRole} from './projectUserRole.model';

export interface Project {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  defaultLocale: string;
  archived: boolean;
  users: ProjectUserRole[];
  createdAt: string;
}
