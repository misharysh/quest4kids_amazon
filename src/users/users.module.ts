import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ConfigTypes } from "./../config/config-types";
import { AuthConfig } from "./../config/auth.config";
import { PasswordService } from './password/password.service';
import { UserService } from './user/user.service';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { AuthGuard } from "./auth.guard";
import { APP_GUARD } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import { UserController } from './user/user.controller';
import { AwsService } from "./../aws/aws.service";
import { RefreshToken } from "./refresh-token.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, RefreshToken]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService<ConfigTypes>) => ({
                secret: config.get<AuthConfig>('auth')?.jwt.secret,
                signOptions: {
                    expiresIn: config.get<AuthConfig>('auth')?.jwt.expiresIn
                }
            })
        }),
    ],
    providers: [PasswordService, AwsService, UserService, AuthService, AuthGuard, RolesGuard, 
    {
        provide: APP_GUARD,
        useClass: AuthGuard
    },
    {
        provide: APP_GUARD,
        useClass: RolesGuard
    },
    ],
    controllers: [AuthController, UserController],
    exports: [UserService]
})
export class UsersModule {}