import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleToUserEntity1740582331038 implements MigrationInterface {
    name = 'AddRoleToUserEntity1740582331038'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "role" character varying NOT NULL DEFAULT '["child"]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "role"`);
    }

}
