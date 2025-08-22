import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateChildAccountCommand } from '../commands/update-child-account.command';
import { User } from '../../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

@CommandHandler(UpdateChildAccountCommand)
export class UpdateChildAccountHandler
  implements ICommandHandler<UpdateChildAccountCommand>
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(command: UpdateChildAccountCommand): Promise<User> {
    const { childId, currentUser, applyChanges } = command;
    const childUser = await this.userRepository.findOne({
      where: { id: childId },
      relations: ['badges', 'badges.badge'],
    });
    if (!childUser) {
      throw new NotFoundException('Child user not found');
    }
    await applyChanges(childUser);
    if (childUser.parentId !== currentUser.id) {
      throw new ForbiddenException('You can only access your children');
    }

    return await this.userRepository.save(childUser);
  }
}
