import {MigrationInterface, QueryRunner} from "typeorm";

export class FixPostId1613241864799 implements MigrationInterface {
    name = 'FixPostId1613241864799'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "platformPostId"`);
        await queryRunner.query(`ALTER TABLE "ticket" ADD "platformPostId" text`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "platform" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."platform" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."supportMembers" IS NULL`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "supportMembers" SET DEFAULT array[]::text[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "supportMembers" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."supportMembers" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."platform" IS NULL`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "platform" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "platformPostId"`);
        await queryRunner.query(`ALTER TABLE "ticket" ADD "platformPostId" character varying NOT NULL`);
    }

}
