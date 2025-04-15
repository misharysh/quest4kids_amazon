export interface TaskStatisticsResponse {
  data: TaskStatisticsItem[];
}

export class TaskStatisticsItem {
  id: string;
  name: string;
  openTasks: number;
  inProgressTasks: number;
  doneTasks: number;
}
