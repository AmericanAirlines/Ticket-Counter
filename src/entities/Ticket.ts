import { Entity, BaseEntity, CreateDateColumn, UpdateDateColumn, Column, PrimaryColumn } from 'typeorm';

export enum Platform {
  Slack = 'Slack',
}

export enum Status {
  Open = 'Open',
  InProgress = 'In Progress',
  Closed = 'Closed',
  Reopened = 'Reopened',
}

@Entity()
export class Ticket extends BaseEntity {
  constructor(issueId: string, authorId: string, authorName: string, platformPostId: string, platform: Platform) {
    super();

    this.issueId = issueId;
    this.authorId = authorId;
    this.authorName = authorName;
    this.platformPostId = platformPostId;
    this.platform = platform;
  }

  @PrimaryColumn()
  issueId: string;

  @Column({ generated: 'increment' })
  number!: number;

  @Column()
  authorName: string;

  @Column()
  authorId: string;

  @Column()
  platformPostId: string;

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
