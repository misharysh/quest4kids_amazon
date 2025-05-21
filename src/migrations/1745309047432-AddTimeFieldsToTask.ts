import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimeFieldsToTask1745309047432 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task" ADD "estimatedTime" smallint DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ADD "actualTime" smallint DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "actualTime"`);
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "estimatedTime"`);
  }
}
