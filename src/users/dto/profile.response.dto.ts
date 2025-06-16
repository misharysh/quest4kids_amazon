import { Badge } from '../../badges/badge.entity';
import { Role } from '../role.enum';
import { Expose } from 'class-transformer';

export class ProfileResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  badges: Badge[];

  @Expose()
  role: Role;

  @Expose()
  parentId?: string;

  @Expose()
  avatarName?: string;

  @Expose()
  availablePoints: number;

  @Expose()
  totalEarnedPoints: number;

  @Expose()
  resetToken?: string;

  @Expose()
  unreadNotificationCount: number;
}
