import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateTicket1613160532736 implements MigrationInterface {
    name = 'CreateTicket1613160532736'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "ticket_platform_enum" AS ENUM('Slack')`);
        await queryRunner.query(`CREATE TYPE "ticket_status_enum" AS ENUM('Open', 'In Progress', 'Closed', 'Reopened')`);
        await queryRunner.query(`CREATE TABLE "ticket" ("issueId" character varying NOT NULL, "number" SERIAL NOT NULL, "authorName" character varying NOT NULL, "authorId" character varying NOT NULL, "platformPostId" character varying NOT NULL, "platform" "ticket_platform_enum" NOT NULL, "status" "ticket_status_enum" NOT NULL DEFAULT 'Open', "supportMembers" text array NOT NULL DEFAULT array[]::text[], "lastClosedDate" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f2884b2e973bc39c7a2f4ecdf26" PRIMARY KEY ("issueId"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "ticket"`);
        await queryRunner.query(`DROP TYPE "ticket_status_enum"`);
        await queryRunner.query(`DROP TYPE "ticket_platform_enum"`);
    }

}
