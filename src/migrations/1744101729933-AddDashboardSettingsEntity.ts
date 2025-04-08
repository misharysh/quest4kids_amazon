import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDashboardSettingsEntity1744101729933 implements MigrationInterface {
    name = 'AddDashboardSettingsEntity1744101729933'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "dashboard_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "layout" jsonb NOT NULL, CONSTRAINT "PK_f14fa968519dd71766387dc831f" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "dashboard_settings"`);
    }

}
