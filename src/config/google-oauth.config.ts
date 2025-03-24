import { registerAs } from "@nestjs/config";

export interface GoogleConfig
{
    clientID: string;
    clientSecret: string;
    callbackURL: string;
}

export const googleConfig = registerAs('google', (): GoogleConfig => ({
    clientID: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '',
}));