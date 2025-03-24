import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigTypes } from "src/config/config-types";
import { GoogleConfig } from "src/config/google-oauth.config";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google')
{
    constructor(
        private readonly configService: ConfigService<ConfigTypes>,
        private readonly authService: AuthService)
    {
        super(
            {
                clientID: configService.get<GoogleConfig>('google')?.clientID ?? '',
                clientSecret:configService.get<GoogleConfig>('google')?.clientSecret ?? '',
                callbackURL:configService.get<GoogleConfig>('google')?.callbackURL,
                scope: ["email", "profile"],
            }
        );

        
    };

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback) {
        const user = await this.authService.validateGoogleUser(profile);

        if (!user)
        {
            throw new UnauthorizedException('We dont have such user in our database');
        }

        done(null, user);
    }
}