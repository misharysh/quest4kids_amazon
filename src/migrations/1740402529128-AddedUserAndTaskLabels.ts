import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedUserAndTaskLabels1740402529128 implements MigrationInterface {
    name = 'AddedUserAndTaskLabels1740402529128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "task_label" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "taskId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_93a72d5d7e5370002fd7a237fd9" UNIQUE ("name", "taskId"), CONSTRAINT "PK_fb2322fb12d4db26386caeff6ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2ed786959519e4915b874d3677" ON "task_label" ("taskId") `);
        await queryRunner.query(`ALTER TABLE "task" ADD "points" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "task" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "task_label" ADD CONSTRAINT "FK_2ed786959519e4915b874d3677b" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_f316d3fe53497d4d8a2957db8b9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_f316d3fe53497d4d8a2957db8b9"`);
        await queryRunner.query(`ALTER TABLE "task_label" DROP CONSTRAINT "FK_2ed786959519e4915b874d3677b"`);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "points"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2ed786959519e4915b874d3677"`);
        await queryRunner.query(`DROP TABLE "task_label"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
