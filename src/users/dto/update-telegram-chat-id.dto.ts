import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTelegramChatIdDto {
  @IsString()
  @IsNotEmpty()
  telegramChatId: string;
}
