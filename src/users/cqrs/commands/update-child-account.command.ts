import { ICommand } from '@nestjs/cqrs';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { CurrentUserDto } from '../../dto/current-user.dto';

export class UpdateChildAccountCommand implements ICommand {
  constructor(
    public readonly childId: string,
    public readonly updateUserDto: UpdateUserDto,
    public readonly currentUser: CurrentUserDto,
  ) {}
}
