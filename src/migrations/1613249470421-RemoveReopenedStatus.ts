import {MigrationInterface, QueryRunner} from "typeorm";

export class RemoveReopenedStatus1613249470421 implements MigrationInterface {
    name = 'RemoveReopenedStatus1613249470421'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."ticket_status_enum" RENAME TO "ticket_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "ticket_status_enum" AS ENUM('Open', 'In Progress', 'Closed')`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "status" TYPE "ticket_status_enum" USING "status"::"text"::"ticket_status_enum"`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "status" SET DEFAULT 'Open'`);
        await queryRunner.query(`DROP TYPE "ticket_status_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."status" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."supportMembers" IS NULL`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "supportMembers" SET DEFAULT array[]::text[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "supportMembers" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."supportMembers" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."status" IS NULL`);
        await queryRunner.query(`CREATE TYPE "ticket_status_enum_old" AS ENUM('Open', 'In Progress', 'Closed', 'Reopened')`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "status" TYPE "ticket_status_enum_old" USING "status"::"text"::"ticket_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "status" SET DEFAULT 'Open'`);
        await queryRunner.query(`DROP TYPE "ticket_status_enum"`);
        await queryRunner.query(`ALTER TYPE "ticket_status_enum_old" RENAME TO  "ticket_status_enum"`);
    }

}
