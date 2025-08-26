import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ClaimPointsCommand } from '../commands/claim-points.command';
import { User } from '../../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

@CommandHandler(ClaimPointsCommand)
export class ClaimPointsHandler implements ICommandHandler<ClaimPointsCommand> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async execute(command: ClaimPointsCommand): Promise<User> {
    const { params, currentUser, pointsDto } = command;
    const id = params.id;
    const child = await this.userRepository.findOne({
      where: { id: id },
      relations: { badges: { badge: true } },
    });
    if (!child) {
      throw new NotFoundException('User not found');
    }
    if (child.parentId !== currentUser.id) {
      throw new ForbiddenException('You can only access your children');
    }
    const exchangePoints = pointsDto.exchangePoints;
    if (exchangePoints > child.availablePoints) {
      throw new ConflictException("You can't exchange that many points");
    }

    child.availablePoints -= exchangePoints;

    return await this.userRepository.save(child);
  }
}
