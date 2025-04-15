import { User } from 'src/users/user.entity';
import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Badge } from './badge.entity';

@Entity()
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.badges)
  user: User;

  @ManyToOne(() => Badge)
  badge: Badge;
}
