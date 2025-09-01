import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetTaskListQuery } from "../queries/get-task-list.query";
import { Repository } from "typeorm";
import { Task } from "src/tasks/task.entity";
import { Role } from "src/users/role.enum";
import { User } from "src/users/user.entity";
import { InjectRepository } from "@nestjs/typeorm";

@QueryHandler(GetTaskListQuery)
export class GetTaskListHandler
    implements IQueryHandler<GetTaskListQuery>
{
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
    ) {}

    execute(query: GetTaskListQuery): Promise<[Task[], number]> {
        const { filters, pagination, currentUser } = query;

        const listQuery = this.taskRepository
              .createQueryBuilder('task')
              .leftJoinAndSelect('task.labels', 'labels');
        
            const isParent = currentUser.role === Role.PARENT;
        
            if (isParent) {
              //get all tasks from all children related to Parent Id
              let queryBuilder = listQuery
                .subQuery()
                .select('user.id')
                .from(User, 'user')
                .where('user.parentId = :parentId', { parentId: currentUser.id });
        
              //filtered by concrete child
              if (filters.childId?.trim()) {
                queryBuilder = queryBuilder.andWhere('user.id = :childId', {
                  childId: filters.childId,
                });
              }
        
              const subQuery = queryBuilder.getQuery();
        
              listQuery.andWhere(`task.userId IN ${subQuery}`);
            } else {
              //get tasks only for concrete child
              listQuery.where('task.userId = :userId', { userId: currentUser.id });
            }
        
            if (filters.status) {
              listQuery.andWhere('task.status = :status', { status: filters.status });
            }
        
            if (filters.search?.trim()) {
              listQuery.andWhere(
                '(task.title ILIKE :search OR task.description ILIKE :search)',
                { search: `%${filters.search}%` },
              );
            }
        
            if (filters.labels?.length) {
              const subQuery = listQuery
                .subQuery()
                .select('labels.taskId')
                .from('task_label', 'labels')
                .where('labels.name IN (:...names)', { names: filters.labels })
                .getQuery();
        
              listQuery.andWhere(`task.id IN ${subQuery}`);
            }
        
            const sortField = filters.sortBy?.trim() || 'createdAt'; // default sort

            const sortOrder =
              filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            listQuery.orderBy(`task.${sortField}`, sortOrder);
        
            listQuery.skip(pagination.offset).take(pagination.limit);
        
            return listQuery.getManyAndCount();
    }
}