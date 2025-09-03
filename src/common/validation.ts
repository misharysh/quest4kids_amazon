import {
  HttpStatus,
  ParseIntPipe,
  ParseUUIDPipe,
  Param,
  Query,
} from '@nestjs/common';
import { RangePipe } from './pipes/range.pipe';

export const Validate = {
  asUuid: () =>
    new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
    }),
  asInt: (opts?: { optional?: boolean }) =>
    new ParseIntPipe({
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      optional: opts?.optional,
    }),
};

export const Path = Param;
export const Q = Query;

export const Uuid = (name = 'id') => Param(name, Validate.asUuid());

export const IntParam = (
  name: string,
  min?: number,
  max?: number,
  optional = false,
) => Param(name, Validate.asInt({ optional }), new RangePipe(min, max, name));

export const IntQuery = (
  name: string,
  min?: number,
  max?: number,
  optional = false,
) => Query(name, Validate.asInt({ optional }), new RangePipe(min, max, name));
