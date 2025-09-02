import { IQuery } from "@nestjs/cqrs";
import { PaginationParams } from "src/common/pagination.params";
import { FindTaskParams } from "src/tasks/dto/find-task.params";
import { CurrentUserDto } from "src/users/dto/current-user.dto";

export class GetTaskListQuery implements IQuery {
    constructor(
        public readonly filters: FindTaskParams,
        public readonly pagination: PaginationParams,
        public readonly currentUser: CurrentUserDto
    ) {}
}