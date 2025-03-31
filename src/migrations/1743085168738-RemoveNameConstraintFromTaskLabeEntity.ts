import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveNameConstraintFromTaskLabeEntity1743085168738 implements MigrationInterface {
    name = 'RemoveNameConstraintFromTaskLabeEntity1743085168738'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_label" DROP CONSTRAINT "UQ_93a72d5d7e5370002fd7a237fd9"`);
        await queryRunner.query(`ALTER TABLE "task_label" DROP CONSTRAINT "UQ_a85b54bdad8b7351e1c3fa15846"`);
        await queryRunner.query(`ALTER TABLE "task_label" ADD CONSTRAINT "UQ_93a72d5d7e5370002fd7a237fd9" UNIQUE ("name", "taskId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_label" DROP CONSTRAINT "UQ_93a72d5d7e5370002fd7a237fd9"`);
        await queryRunner.query(`ALTER TABLE "task_label" ADD CONSTRAINT "UQ_a85b54bdad8b7351e1c3fa15846" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "task_label" ADD CONSTRAINT "UQ_93a72d5d7e5370002fd7a237fd9" UNIQUE ("taskId", "name")`);
    }

}
