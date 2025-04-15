import { Role } from '../role.enum';

export class CurrentUserDto {
  id: string;
  role: Role;
  name: string;
}
