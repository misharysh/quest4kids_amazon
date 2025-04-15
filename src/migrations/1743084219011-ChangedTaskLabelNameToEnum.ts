import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangedTaskLabelNameToEnum1743084219011
  implements MigrationInterface
{
  name = 'ChangedTaskLabelNameToEnum1743084219011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_label" DROP CONSTRAINT "UQ_93a72d5d7e5370002fd7a237fd9"`,
    );
    await queryRunner.query(`ALTER TABLE "task_label" DROP COLUMN "name"`);
    await queryRunner.query(
      `CREATE TYPE "public"."task_label_name_enum" AS ENUM('Home', 'School', 'Sports', 'Art', 'Music', 'Reading', 'Friends', 'Family', 'Science', 'Coding', 'Nature')`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_label" ADD "name" "public"."task_label_name_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_label" ADD CONSTRAINT "UQ_a85b54bdad8b7351e1c3fa15846" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_label" ADD CONSTRAINT "UQ_93a72d5d7e5370002fd7a237fd9" UNIQUE ("name", "taskId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_label" DROP CONSTRAINT "UQ_93a72d5d7e5370002fd7a237fd9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_label" DROP CONSTRAINT "UQ_a85b54bdad8b7351e1c3fa15846"`,
    );
    await queryRunner.query(`ALTER TABLE "task_label" DROP COLUMN "name"`);
    await queryRunner.query(`DROP TYPE "public"."task_label_name_enum"`);
    await queryRunner.query(
      `ALTER TABLE "task_label" ADD "name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_label" ADD CONSTRAINT "UQ_93a72d5d7e5370002fd7a237fd9" UNIQUE ("name", "taskId")`,
    );
  }
}
