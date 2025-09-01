import { TaskLabel } from "src/tasks/task-label.entity";

export class SetRewardCommand {
    constructor(
        public readonly labels: TaskLabel[],
        public readonly userId: string,
    ) {}
}