import { Expose } from 'class-transformer';

export class UserWithOnlineStatusDto {
  constructor(private readonly partial?: Partial<UserWithOnlineStatusDto>) {
    Object.assign(this, partial);
  }

  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  isOnline: boolean;
}
