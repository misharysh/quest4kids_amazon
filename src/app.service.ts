import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigTypes } from './config/config-types';
import { AppConfig } from './config/app.config';

@Injectable()
export class AppService {
  
  constructor(private readonly configService: ConfigService<ConfigTypes>) {};

  getHello(): string {
    const prefix = this.configService.get<AppConfig>('app')?.messagePrefix;
    return 'Hello ' + prefix;
  }
}
