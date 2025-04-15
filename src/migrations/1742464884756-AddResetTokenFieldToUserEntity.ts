import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetTokenFieldToUserEntity1742464884756
  implements MigrationInterface
{
  name = 'AddResetTokenFieldToUserEntity1742464884756';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "resetToken" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetToken"`);
  }
}
