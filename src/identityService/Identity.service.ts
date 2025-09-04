import { User } from 'src/users/user.entity';

export interface IIdentityService {
  createUser(user: IdentityUser);
  updateUser(user: IdentityUser);
}

export class IdentityUser {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  initialPassword: string;
}
