import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskStatus } from './task.model';
import { User } from '../users/user.entity';
import { TaskLabel } from './task-label.entity';
import { UserTaskCompletion } from './../users/user-task-completion.entity';
import { TaskCommentsEntity } from './entities/task-comments.entity';
import { TaskStatusLogsEntity } from './entities/task-status-logs.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.OPEN,
  })
  status: TaskStatus;

  @Column({
    nullable: true,
  })
  points?: number;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.tasks, { nullable: false })
  user: User;

  @OneToMany(() => TaskLabel, (label) => label.task, {
    cascade: true,
  })
  labels: TaskLabel[];

  @OneToMany(() => UserTaskCompletion, (completion) => completion.task)
  completions: UserTaskCompletion[];

  @Column({ type: 'smallint', nullable: true, default: 0 })
  estimatedTime: number;

  @Column({ type: 'smallint', nullable: true, default: 0 })
  actualTime: number;

  @OneToMany(() => TaskCommentsEntity, (comment) => comment.task)
  comments: TaskCommentsEntity[];

  @OneToMany(() => TaskStatusLogsEntity, (log) => log.task)
  logs: TaskStatusLogsEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
