import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvatarNameFieldToUserEntity1741336175565 implements MigrationInterface {
    name = 'AddAvatarNameFieldToUserEntity1741336175565'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "avatarName" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatarName"`);
    }

}
