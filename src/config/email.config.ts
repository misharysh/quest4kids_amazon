import { registerAs } from '@nestjs/config';

export interface EmailConfig {
  urlResetPassword: string;
}

export const emailConfig = registerAs(
  'email',
  (): EmailConfig => ({
    urlResetPassword: process.env.URL_RESET_PASSWORD ?? '',
  }),
);
