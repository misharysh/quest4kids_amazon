import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMessageEntity1744982293523 implements MigrationInterface {
    name = 'AddMessageEntity1744982293523'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "senderId" character varying NOT NULL, "receiverId" character varying NOT NULL, "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "isRead" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "message"`);
    }

}
