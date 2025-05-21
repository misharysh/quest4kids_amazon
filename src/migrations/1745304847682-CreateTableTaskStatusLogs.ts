import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableTaskStatusLogs1745304847682
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "task_status_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_id" uuid, "user_id" uuid, "prev_status" "public"."task_status_enum" NOT NULL DEFAULT 'OPEN', "new_status" "public"."task_status_enum" NOT NULL DEFAULT 'OPEN', "changedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_task_status_logs_id" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "task_status_logs"`);
  }
}
