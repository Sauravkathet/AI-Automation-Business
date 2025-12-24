import { IUser } from '../models/User';
import { IOrganization } from '../models/Organization';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      organization?: IOrganization;
      organizationId?: string;
    }
  }
}