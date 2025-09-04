import { Task } from 'src/tasks/task.entity';
import { User } from 'src/users/user.entity';

export class CreateTaskCommentCommand {
  constructor(
    public readonly user: User | null,
    public readonly task: Task,
    public readonly comment?: string,
  ) {}
}
