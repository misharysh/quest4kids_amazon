import { registerAs } from "@nestjs/config";

export interface EmailConfig
{
    emailHost: string;
    emailUsername: string;
    emailPassword: string;
    urlResetPassword: string;
}

export const emailConfig = registerAs('email', (): EmailConfig => ({
    emailHost: process.env.EMAIL_HOST ?? '',
    emailUsername: process.env.EMAIL_USERNAME ?? '',
    emailPassword: process.env.EMAIL_PASSWORD  ?? '',
    urlResetPassword: process.env.URL_RESET_PASSWORD ?? '',
}));