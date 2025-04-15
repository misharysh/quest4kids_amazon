import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthConfig } from '../config/auth.config';
import { EmailConfig } from '../config/email.config';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async sendResetPasswordLink(email: string): Promise<string> {
    const payload = { email };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<AuthConfig>('auth')?.jwt.secret,
      expiresIn: this.configService.get<AuthConfig>('auth')?.jwt.expiresIn,
    });

    const url = `${this.configService.get<EmailConfig>('email')?.urlResetPassword}?token=${token}`;
    const text = `Hi, \nTo reset your password, click here: ${url}`;

    this.sendMail({
      to: email,
      subject: 'Reset Password',
      text,
    });

    return token;
  }

  public async decodeConfirmationToken(token: string): Promise<string> {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get<AuthConfig>('auth')?.jwt.secret,
      });

      if (typeof payload === 'object' && 'email' in payload) {
        return payload.email;
      }

      throw new BadRequestException();
    } catch (err) {
      if (err?.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired');
      }

      throw new BadRequestException('Bad confirmation token');
    }
  }

  private sendMail(options: ISendMailOptions): void {
    try {
      this.mailerService.sendMail(options);
    } catch (err) {
      console.log(err);
    }
  }
}
