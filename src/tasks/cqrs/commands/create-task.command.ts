import { ICommand } from '@nestjs/cqrs';
import { CreateTaskDto } from 'src/tasks/dto/create-task.dto';
import { User } from 'src/users/user.entity';

export class CreateTaskCommand implements ICommand {
  constructor(
    public readonly createTask: CreateTaskDto,
    public readonly user: User,
  ) {}
}
