import {MigrationInterface, QueryRunner} from "typeorm";

export class AddGitHubToPlatform1613247247560 implements MigrationInterface {
    name = 'AddGitHubToPlatform1613247247560'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."ticket_platform_enum" RENAME TO "ticket_platform_enum_old"`);
        await queryRunner.query(`CREATE TYPE "ticket_platform_enum" AS ENUM('GitHub', 'Slack')`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "platform" TYPE "ticket_platform_enum" USING "platform"::"text"::"ticket_platform_enum"`);
        await queryRunner.query(`DROP TYPE "ticket_platform_enum_old"`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "platform" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."platform" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."supportMembers" IS NULL`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "supportMembers" SET DEFAULT array[]::text[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "supportMembers" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."supportMembers" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."platform" IS NULL`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "platform" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "ticket_platform_enum_old" AS ENUM('Slack')`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "platform" TYPE "ticket_platform_enum_old" USING "platform"::"text"::"ticket_platform_enum_old"`);
        await queryRunner.query(`DROP TYPE "ticket_platform_enum"`);
        await queryRunner.query(`ALTER TYPE "ticket_platform_enum_old" RENAME TO  "ticket_platform_enum"`);
    }

}
