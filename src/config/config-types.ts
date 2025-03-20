import * as Joi from 'joi';

import { AppConfig } from "./app.config";
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthConfig } from './auth.config';
import { AmazonConfig } from './amazon.config';
import { EmailConfig } from './email.config';

export interface ConfigTypes {
    app: AppConfig;
    database: TypeOrmModuleOptions;
    auth: AuthConfig;
    amazon: AmazonConfig;
    email: EmailConfig;
}

export const appConfigSchema = Joi.object({
    APP_MESSAGE_PREFIX: Joi.string().default(' hello'),
    DB_URL: Joi.string().required(),
    DB_SYNC: Joi.number().valid(0,1).required(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().required(),
    AMAZON_ACCESS_KEY_ID: Joi.string().required(),
    AMAZON_SECRET_ACCESS_KEY: Joi.string().required(),
    AMAZON_BUCKET: Joi.string().required(),
    EMAIL_USERNAME: Joi.string().required(),
    EMAIL_PASSWORD: Joi.string().required(),
    URL_RESET_PASSWORD: Joi.string().required(),
    EMAIL_HOST: Joi.string().required(),
});