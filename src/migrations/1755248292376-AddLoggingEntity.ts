import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLoggingEntity1755248292376 implements MigrationInterface {
    name = 'AddLoggingEntity1755248292376'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."logs_level_enum" AS ENUM('trace', 'debug', 'info', 'warning', 'error', 'critical')`);
        await queryRunner.query(`CREATE TABLE "logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "level" "public"."logs_level_enum" NOT NULL, "category" character varying NOT NULL, "message" character varying NOT NULL, "properties" jsonb, CONSTRAINT "PK_fb1b805f2f7795de79fa69340ba" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "logs"`);
        await queryRunner.query(`DROP TYPE "public"."logs_level_enum"`);
    }

}
