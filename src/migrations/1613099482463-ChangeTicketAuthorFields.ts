import {MigrationInterface, QueryRunner} from "typeorm";

export class ChangeTicketAuthorFields1613099482463 implements MigrationInterface {
    name = 'ChangeTicketAuthorFields1613099482463'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "ticket_platform_enum" AS ENUM('Slack')`);
        await queryRunner.query(`CREATE TYPE "ticket_status_enum" AS ENUM('Open', 'In Progress', 'Closed', 'Reopened')`);
        await queryRunner.query(`CREATE TABLE "ticket" ("id" SERIAL NOT NULL, "authorName" character varying NOT NULL, "authorId" character varying NOT NULL, "issueId" character varying NOT NULL, "platformPostId" character varying NOT NULL, "platform" "ticket_platform_enum" NOT NULL, "status" "ticket_status_enum" NOT NULL DEFAULT 'Open', "supportMembers" character varying array NOT NULL DEFAULT '[]', "lastClosedDate" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d9a0835407701eb86f874474b7c" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "ticket"`);
        await queryRunner.query(`DROP TYPE "ticket_status_enum"`);
        await queryRunner.query(`DROP TYPE "ticket_platform_enum"`);
    }

}
