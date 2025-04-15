import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakePointsOptional1740405116357 implements MigrationInterface {
  name = 'MakePointsOptional1740405116357';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "points" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "points" SET NOT NULL`,
    );
  }
}
