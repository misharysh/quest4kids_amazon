import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddZitadelIdToUserEntity1756832531276
  implements MigrationInterface
{
  name = 'AddZitadelIdToUserEntity1756832531276';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "zitadel_id" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "zitadel_id"`);
  }
}
