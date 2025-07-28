import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTelegramChatId1751965537380 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'telegram_chat_id',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user', 'telegram_chat_id');
  }
}
