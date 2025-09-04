import { ICommand } from '@nestjs/cqrs';
import { CurrentUserDto } from 'src/users/dto/current-user.dto';

export class CreateTasksFromCsvCommand implements ICommand {
  constructor(
    public readonly file: Express.Multer.File,
    public readonly currentUser: CurrentUserDto,
  ) {}
}
