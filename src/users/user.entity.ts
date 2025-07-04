import { Exclude, Expose } from 'class-transformer';
import { Task } from '../tasks/task.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.enum';
import { UserTaskCompletion } from './user-task-completion.entity';
import { UserBadge } from '../badges/user-badge.entity';
import { DashboardSettings } from '../dashboardSettings/dashboard-settings.entity';
import { TaskCommentsEntity } from '../tasks/entities/task-comments.entity';
import { TaskStatusLogsEntity } from '../tasks/entities/task-status-logs.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @Column()
  @Expose()
  name: string;

  @Column()
  @Expose()
  email: string;

  @Exclude()
  @Column()
  password: string;

  @CreateDateColumn()
  @Expose()
  createdAt: Date;

  @UpdateDateColumn()
  @Expose()
  updatedAt: Date;

  @OneToMany(() => Task, (task) => task.user)
  @Expose()
  tasks: Task[];

  @Expose()
  @OneToMany(() => UserTaskCompletion, (completion) => completion.user)
  completedTasks: UserTaskCompletion[];

  @Expose()
  @OneToMany(() => UserBadge, (userBadge) => userBadge.user)
  badges: UserBadge[];

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CHILD,
  })
  @Expose()
  role: Role;

  @Column({
    nullable: true,
  })
  @Expose()
  parentId?: string;

  @Expose()
  @Column({
    nullable: true,
  })
  avatarName?: string;

  @Expose()
  @Column({
    default: 0,
  })
  availablePoints: number;

  @Expose()
  @Column({
    default: 0,
  })
  totalEarnedPoints: number;

  @Expose()
  @Column({
    nullable: true,
  })
  resetToken?: string;

  @OneToOne(() => DashboardSettings, (settings) => settings.user, {
    cascade: true,
  })
  @Expose()
  dashboardSettings: DashboardSettings;

  @OneToMany(() => TaskCommentsEntity, (comment) => comment.user)
  comments: TaskCommentsEntity[];

  @OneToMany(() => TaskStatusLogsEntity, (log) => log.user)
  logs: TaskStatusLogsEntity[];
}
