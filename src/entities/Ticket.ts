import { Entity, BaseEntity, CreateDateColumn, UpdateDateColumn, Column, PrimaryColumn } from 'typeorm';

export enum Platform {
  Slack = 'Slack',
}

export enum Status {
  Open = 'Open',
  InProgress = 'In Progress',
  Closed = 'Closed',
}

@Entity()
export class Ticket extends BaseEntity {
  constructor(
    issueId: string,
    issueNumber: number,
    authorId: string,
    authorName: string,
    platform: Platform,
    platformPostId: string | null = null,
  ) {
    super();

    this.issueId = issueId;
    this.issueNumber = issueNumber;
    this.authorId = authorId;
    this.authorName = authorName;
    this.platformPostId = platformPostId;
    this.platform = platform;
  }

  @PrimaryColumn()
  issueId: string;

  @Column()
  issueNumber: number;

  @Column()
  authorName: string;

  @Column()
  authorId: string;

  @Column({ type: 'text', nullable: true })
  platformPostId: string | null;

  @Column({ type: 'enum', enum: Platform })
  platform: Platform;

  @Column({ type: 'enum', enum: Status, default: Status.Open })
  status!: Status;

  @Column({ type: 'text', array: true, default: () => 'array[]::text[]' })
  supportMembers!: string[];

  @CreateDateColumn()
  lastClosedDate!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
