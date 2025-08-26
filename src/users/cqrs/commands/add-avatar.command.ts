import { ICommand } from '@nestjs/cqrs';
import { FindOneParams } from '../../../tasks/dto/find-one.params';
import { CurrentUserDto } from '../../dto/current-user.dto';

export class AddAvatarCommand implements ICommand {
  constructor(
    public readonly params: FindOneParams,
    public readonly currentUser: CurrentUserDto,
    public readonly file: Express.Multer.File,
  ) {}
}
