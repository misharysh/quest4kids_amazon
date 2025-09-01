import { CommandBus, CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateTaskCommand } from "../commands/create-task.command";
import { Task } from "src/tasks/task.entity";
import { TaskLabel } from "src/tasks/task-label.entity";
import { TaskStatus } from "src/tasks/task.model";
import { UserTaskCompletion } from "src/users/user-task-completion.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/user.entity";
import { TaskLabelEnum } from "src/tasks/task-label.enum";
import { SetRewardCommand } from "src/badges/cqrs/commands/set-rewards.command";
import { CreateTaskCommentCommand } from "../commands/create-task-comment.command";

@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler
    implements ICommandHandler<CreateTaskCommand, Task>
{
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectRepository(TaskLabel)
        private labelsRepository: Repository<TaskLabel>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(UserTaskCompletion)
        private userTaskCompletionsRepository: Repository<UserTaskCompletion>,
        private readonly commandBus: CommandBus,
    ) {}

    async execute(command: CreateTaskCommand): Promise<Task> {
        const {createTask, user } = command;
        const { labels, ...taskData } = createTask;
        const comment = createTask.comment;
        const task = await this.taskRepository.create(taskData);
    
        await this.taskRepository.save(task);
    
        let newLabels: TaskLabel[] = [];
    
        if (labels && labels.length > 0) {
            const uniqueLabels = this.getUniqueLabels(labels);
    
            newLabels = uniqueLabels.map((label) =>
            this.labelsRepository.create({
                name: label,
                task: task,
            }),
            );
    
            await this.labelsRepository.save(newLabels);
        }
    
        await this.commandBus.execute(new CreateTaskCommentCommand(user, task, comment),);
    
        if (taskData.status === TaskStatus.DONE) {
            //awards points in case of DONE
            const points = taskData.points ? taskData.points : 0;
    
            user.availablePoints += points;
            user.totalEarnedPoints += points;
    
            await this.usersRepository.save(user);
    
            const userTaskCompletion = new UserTaskCompletion();
            userTaskCompletion.user = user;
            userTaskCompletion.task = task;
            userTaskCompletion.points = points;
    
            await this.userTaskCompletionsRepository.save(userTaskCompletion);
    
            await this.commandBus.execute(new SetRewardCommand(newLabels, user.id));
        }
    
        return task;
    }

    private getUniqueLabels(labelsDtos: TaskLabelEnum[]): TaskLabelEnum[] {
        return [...new Set(labelsDtos)];
    }
}