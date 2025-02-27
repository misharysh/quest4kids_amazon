import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParentIdToUserEntity1740651605309 implements MigrationInterface {
    name = 'AddParentIdToUserEntity1740651605309'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "parentId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "parentId"`);
    }

}
