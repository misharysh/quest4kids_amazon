import { ICommand } from '@nestjs/cqrs';
import { GenerateTaskDto } from 'src/tasks/dto/generate-task.dto';

export class GenerateTaskCommand implements ICommand {
  constructor(public readonly generateTaskDto: GenerateTaskDto) {}
}
