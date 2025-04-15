import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPointsFieldsToUserEntity1742219409481
  implements MigrationInterface
{
  name = 'AddPointsFieldsToUserEntity1742219409481';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "availablePoints" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "totalEarnedPoints" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "totalEarnedPoints"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "availablePoints"`);
  }
}
