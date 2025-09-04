import { CommandBus, ICommandHandler } from '@nestjs/cqrs';
import { CreateTasksFromCsvCommand } from '../commands/create-tasks-from-csv.command';
import * as csv from 'csv-parse';
import { CreateTaskDto } from 'src/tasks/dto/create-task.dto';
import { User } from 'src/users/user.entity';
import { CurrentUserDto } from 'src/users/dto/current-user.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskCommand } from '../commands/create-task.command';
import { Task } from 'src/tasks/task.entity';

export class CreateTasksFromCsvHandler
  implements ICommandHandler<CreateTasksFromCsvCommand, any>
{
  constructor(
    private commandBus: CommandBus,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async execute(command: CreateTasksFromCsvCommand): Promise<any> {
    const { file, currentUser } = command;

    const csvContent = file.buffer;

    const parsedData: any = await new Promise((resolve, reject) => {
      csv.parse(
        csvContent,
        {
          columns: true,
          relax_quotes: true,
          skip_empty_lines: true,
          cast: true,
        },
        (err, records) => {
          if (err) {
            reject(err);

            return { error: true, message: 'Unable to parse file' };
          }

          resolve(records);
        },
      );
    });

    const errors: string[] = [];
    const validDtos: { csvDto: CreateTaskDto; childUser: User }[] = [];

    if (!parsedData.length) {
      errors.push('Empty file Provided');

      return {
        error: true,
        message: 'File Validation Failed',
        errorsArray: errors,
      };
    }

    //validate rows
    for await (const [index, rowData] of parsedData.entries()) {
      const validationErrors = await this.validateFileRow(
        rowData,
        currentUser,
        validDtos,
      );

      if (validationErrors.length) {
        return {
          error: true,
          message: `File Rows Validation Failed at row ${index + 1}`,
          errorsArray: validationErrors,
        };
      }
    }

    const createdTasks: Task[] = [];
    for (const item of validDtos) {
      const task = await this.commandBus.execute(
        new CreateTaskCommand(item.csvDto, item.childUser),
      );

      createdTasks.push(task);
    }

    return { error: false, validData: validDtos };
  }

  private async validateFileRow(
    rowData: any,
    currentUser: CurrentUserDto,
    validDtos: { csvDto: CreateTaskDto; childUser: User }[],
  ) {
    const errors: string[] = [];

    const csvDto = plainToInstance(CreateTaskDto, rowData);

    const validationErrors = await validate(csvDto);

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => {
        const { property, constraints } = error;
        if (constraints) {
          const errorMessage = `${property}: ${Object.values(constraints).join(', ')}`;
          errors.push(errorMessage);
        } else {
          errors.push(`${property}: validation error`);
        }
      });
    }

    let childUser: User | null = null;

    if (csvDto.userId !== undefined) {
      childUser = await this.usersRepository.findOneBy({ id: csvDto.userId });

      if (!childUser) {
        errors.push('Child user not found');
      }

      //check if this childUser has ParentId as current user id
      if (childUser?.parentId !== currentUser.id) {
        errors.push('You can only access your children');
      }
    }

    if (errors.length === 0 && childUser) {
      validDtos.push({ csvDto, childUser });
    }

    return errors;
  }
}
