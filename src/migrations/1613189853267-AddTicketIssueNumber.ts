import {MigrationInterface, QueryRunner} from "typeorm";

export class AddTicketIssueNumber1613189853267 implements MigrationInterface {
    name = 'AddTicketIssueNumber1613189853267'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket" RENAME COLUMN "number" TO "issueNumber"`);
        await queryRunner.query(`ALTER SEQUENCE "ticket_number_seq" RENAME TO "ticket_issueNumber_seq"`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."issueNumber" IS NULL`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "issueNumber" DROP DEFAULT`);
        await queryRunner.query(`DROP SEQUENCE "ticket_issueNumber_seq"`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."supportMembers" IS NULL`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "supportMembers" SET DEFAULT array[]::text[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "supportMembers" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."supportMembers" IS NULL`);
        await queryRunner.query(`CREATE SEQUENCE "ticket_issueNumber_seq" OWNED BY "ticket"."issueNumber"`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "issueNumber" SET DEFAULT nextval('ticket_issueNumber_seq')`);
        await queryRunner.query(`COMMENT ON COLUMN "ticket"."issueNumber" IS NULL`);
        await queryRunner.query(`ALTER SEQUENCE "ticket_issueNumber_seq" RENAME TO "ticket_number_seq"`);
        await queryRunner.query(`ALTER TABLE "ticket" RENAME COLUMN "issueNumber" TO "number"`);
    }

}
