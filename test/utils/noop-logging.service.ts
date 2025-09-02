import { Injectable } from "@nestjs/common";

@Injectable()
export class NoopLoggingService {
  log() {}
  info() {}
  error() {}
  scope() {}
}