import { Entity, BaseEntity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';

enum Platform {
  GitHub = 'GitHub',
  Slack = 'Slack',
  Teams = 'Teams',
}

enum Status {
  Open = 'Open',
  InProgress = 'In Progress',
  Closed = 'Closed',
  Reopened = 'Reopened',
}

@Entity()
export class Ticket extends BaseEntity {
  constructor(author: string) {
    super();

    this.author = author;
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  author: string;

  @Column({ type: 'enum', enum: Platform })
  platform: Platform;

  @Column({ type: 'enum', enum: Status, default: Status.Open })
  status!: Status;

  @Column()
  closingSupportMember: string;

  @CreateDateColumn()
  lastClosedDate!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
