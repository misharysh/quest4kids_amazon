import { TaskLabelEnum } from '../tasks/task-label.enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  requiredPoints: number;

  @Column({
    type: 'enum',
    enum: TaskLabelEnum,
  })
  label: TaskLabelEnum;
}
