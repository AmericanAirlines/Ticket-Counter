import {MigrationInterface, QueryRunner} from "typeorm";

export class TicketPlatformPostIdNotNull1613319534401 implements MigrationInterface {
    name = 'TicketPlatformPostIdNotNull1613319534401'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_bd2663339286e16dde10eda857"`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "platformPostId" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."platformPostId" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."supportMembers" IS NULL`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "supportMembers" SET DEFAULT array[]::text[]`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bd2663339286e16dde10eda857" ON "ticket" ("platform", "platformPostId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_bd2663339286e16dde10eda857"`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "supportMembers" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."supportMembers" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."platformPostId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "platformPostId" DROP NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bd2663339286e16dde10eda857" ON "ticket" ("platform", "platformPostId") `);
    }

}
