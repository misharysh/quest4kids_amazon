import { ICommand } from '@nestjs/cqrs';
import { FindOneParams } from '../../../tasks/dto/find-one.params';
import { CurrentUserDto } from '../../dto/current-user.dto';
import { PointsDto } from '../../dto/points.dto';

export class ClaimPointsCommand implements ICommand {
  constructor(
    public readonly params: FindOneParams,
    public readonly currentUser: CurrentUserDto,
    public readonly pointsDto: PointsDto,
  ) {}
}
