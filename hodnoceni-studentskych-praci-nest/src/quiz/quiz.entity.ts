import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  commitHash: string;

  @Column({ nullable: true })
  repositoryName: string;

  @Column('simple-json')
  questions: any;

  @CreateDateColumn()
  createdAt: Date;
}
