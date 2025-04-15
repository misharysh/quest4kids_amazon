import { Expose } from 'class-transformer';

export class ParentResponse {
  constructor(private readonly partial?: Partial<ParentResponse>) {
    Object.assign(this, partial);
  }

  @Expose()
  message: string;
}
