import { UpdateTaskDto } from 'src/tasks/dto/update-task.dto';
import { CurrentUserDto } from 'src/users/dto/current-user.dto';

export class UpdateTaskCommand {
  constructor(
    public readonly taskId: string,
    public readonly updateTaskDto: UpdateTaskDto,
    public readonly currentUser: CurrentUserDto,
  ) {}
}
