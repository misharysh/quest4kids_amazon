import { ICommand } from '@nestjs/cqrs';
import { CreateUserDto } from '../../dto/create-user.dto';
import { CurrentUserDto } from '../../dto/current-user.dto';

export class CreateChildAccountCommand implements ICommand {
  constructor(
    public readonly createUser: CreateUserDto,
    public readonly currentUser: CurrentUserDto,
  ) {}
}
