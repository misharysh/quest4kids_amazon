import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class RangePipe implements PipeTransform<number, number> {
  constructor(
    private readonly min?: number,
    private readonly max?: number,
    private readonly name = 'value',
  ) {}

  transform(value: number) {
    if (!value) {
      return value;
    }

    if (this.min !== undefined && value < this.min) {
      throw new BadRequestException(`${this.name} must be >= ${this.min}`);
    }

    if (this.max !== undefined && value > this.max) {
      throw new BadRequestException(`${this.name} must be <= ${this.max}`);
    }

    return value;
  }
}
