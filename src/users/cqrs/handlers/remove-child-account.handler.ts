import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RemoveChildAccountCommand } from '../commands/remove-child-account.command';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../user.entity';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

@CommandHandler(RemoveChildAccountCommand)
export class RemoveChildAccountHandler
  implements ICommandHandler<RemoveChildAccountCommand>
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async execute(command: RemoveChildAccountCommand): Promise<void> {
    const { params, currentUser } = command;
    const id = params.id;
    const childUser = await this.userRepository.findOne({
      where: { id: id },
      relations: { badges: { badge: true } },
    });
    if (!childUser) {
      throw new NotFoundException('Child user not found');
    }
    if (childUser.parentId !== currentUser.id) {
      throw new ForbiddenException('You can only access your children');
    }

    await this.userRepository.remove(childUser);
  }
}
