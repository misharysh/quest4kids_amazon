import * as Joi from 'joi';

import { AppConfig } from "./app.config";
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthConfig } from './auth.config';

export interface ConfigTypes {
    app: AppConfig;
    database: TypeOrmModuleOptions;
    auth: AuthConfig;
}

export const appConfigSchema = Joi.object({
    APP_MESSAGE_PREFIX: Joi.string().default(' hello'),
    DB_HOST: Joi.string().default('localhost'),
    DB_PORT: Joi.number().default(5432),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_DATABASE: Joi.string().required(),
    DB_SYNC: Joi.number().valid(0,1).required(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().required()
});