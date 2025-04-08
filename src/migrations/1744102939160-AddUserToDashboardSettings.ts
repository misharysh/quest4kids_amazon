import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserToDashboardSettings1744102939160 implements MigrationInterface {
    name = 'AddUserToDashboardSettings1744102939160'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dashboard_settings" ADD "user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "dashboard_settings" ADD CONSTRAINT "UQ_18e36cb3085e0c39f438ac12992" UNIQUE ("user_id")`);
        await queryRunner.query(`ALTER TABLE "dashboard_settings" ADD CONSTRAINT "FK_18e36cb3085e0c39f438ac12992" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dashboard_settings" DROP CONSTRAINT "FK_18e36cb3085e0c39f438ac12992"`);
        await queryRunner.query(`ALTER TABLE "dashboard_settings" DROP CONSTRAINT "UQ_18e36cb3085e0c39f438ac12992"`);
        await queryRunner.query(`ALTER TABLE "dashboard_settings" DROP COLUMN "user_id"`);
    }

}
