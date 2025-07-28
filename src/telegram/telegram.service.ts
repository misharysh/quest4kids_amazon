import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>(
      'TELEGRAM_BOT_TOKEN',
      '7812827402:AAHj5F-_zedRE4z9NQawOFZDxo0cqmdXal4',
    );
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
    }
    this.bot = new Telegraf(token);
  }

  async onModuleInit() {
    this.bot.command('start', (ctx) => {
      const chatId = ctx.chat.id;
      ctx.reply(
        `Ваш Chat ID: ${chatId}\nИспользуйте этот ID для привязки к вашему аккаунту.`,
      );
    });

    await this.bot.launch();
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error('Error sending telegram message:', error);
    }
  }

  onModuleDestroy() {
    this.bot.stop();
  }
}
