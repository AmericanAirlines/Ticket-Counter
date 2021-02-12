import { Entity, BaseEntity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';

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
  constructor(author: string, issueId: string, platformPostId: string, platform: Platform) {
    super();

    this.author = author;
    this.issueId = issueId;
    this.platformPostId = platformPostId;
    this.platform = platform;
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  author: string;

  @Column()
  issueId: string;

  @Column()
  platformPostId: string;

  @Column({ type: 'enum', enum: Platform })
  platform: Platform;

  @Column({ type: 'enum', enum: Status, default: Status.Open })
  status!: Status;

  @Column({ type: 'varchar', array: true, default: [] })
  supportMembers!: string[];

  @CreateDateColumn()
  lastClosedDate!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
