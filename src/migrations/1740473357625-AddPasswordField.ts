import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordField1740473357625 implements MigrationInterface {
    name = 'AddPasswordField1740473357625'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "password" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "task" ALTER COLUMN "points" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task" ALTER COLUMN "points" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password"`);
    }

}
