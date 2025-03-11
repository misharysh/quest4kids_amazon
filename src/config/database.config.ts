import { registerAs } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const typeOrmConfig = registerAs('database', (): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: process.env.DB_URL ?? '',
    synchronize: false,
}));