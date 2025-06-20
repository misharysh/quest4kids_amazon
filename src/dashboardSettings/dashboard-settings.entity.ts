import { User } from '../users/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class DashboardSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.dashboardSettings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'jsonb' })
  layout: DashboardElement[];
}

export interface DashboardElement {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minH?: number;
  maxH?: number;
  minW?: number;
  maxW?: number;
  static: boolean;
  moved: boolean;
  isResizable: boolean;
  isDraggable: boolean;
  isVisible: boolean;
}
