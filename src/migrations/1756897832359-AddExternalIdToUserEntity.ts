import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExternalIdToUserEntity1756897832359
  implements MigrationInterface
{
  name = 'AddExternalIdToUserEntity1756897832359';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "zitadel_id" TO "external_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "external_id" TO "zitadel_id"`,
    );
  }
}
