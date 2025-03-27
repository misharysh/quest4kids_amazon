import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTaskCompletionEntity1743068715993 implements MigrationInterface {
    name = 'AddUserTaskCompletionEntity1743068715993'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_task_completion" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "points" integer NOT NULL DEFAULT '0', "userId" uuid, "taskId" uuid, CONSTRAINT "PK_7ae806e62c545e8263a0b0671d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_task_completion" ADD CONSTRAINT "FK_ff43b594785cd3a516534bd5010" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_task_completion" ADD CONSTRAINT "FK_709992939799f1906ad44f41d88" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_task_completion" DROP CONSTRAINT "FK_709992939799f1906ad44f41d88"`);
        await queryRunner.query(`ALTER TABLE "user_task_completion" DROP CONSTRAINT "FK_ff43b594785cd3a516534bd5010"`);
        await queryRunner.query(`DROP TABLE "user_task_completion"`);
    }

}
