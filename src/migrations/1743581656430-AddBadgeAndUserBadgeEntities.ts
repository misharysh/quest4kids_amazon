import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBadgeAndUserBadgeEntities1743581656430
  implements MigrationInterface
{
  name = 'AddBadgeAndUserBadgeEntities1743581656430';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."badge_label_enum" AS ENUM('Home', 'School', 'Sports', 'Art', 'Music', 'Reading', 'Friends', 'Family', 'Science', 'Coding', 'Nature')`,
    );
    await queryRunner.query(
      `CREATE TABLE "badge" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "requiredPoints" integer NOT NULL, "label" "public"."badge_label_enum" NOT NULL, CONSTRAINT "PK_76b7011c864d4521a14a5196c49" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_badge" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "badgeId" uuid, CONSTRAINT "PK_c5db2542e028558c5306c9d7f42" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badge" ADD CONSTRAINT "FK_dc6bb11dce7a0a591b5cae0af25" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badge" ADD CONSTRAINT "FK_8a49533f303db990198b8c9ddf7" FOREIGN KEY ("badgeId") REFERENCES "badge"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_badge" DROP CONSTRAINT "FK_8a49533f303db990198b8c9ddf7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badge" DROP CONSTRAINT "FK_dc6bb11dce7a0a591b5cae0af25"`,
    );
    await queryRunner.query(`DROP TABLE "user_badge"`);
    await queryRunner.query(`DROP TABLE "badge"`);
    await queryRunner.query(`DROP TYPE "public"."badge_label_enum"`);
  }
}
