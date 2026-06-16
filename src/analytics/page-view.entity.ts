import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('page_views')
@Index(['page'])
@Index(['sessionId'])
@Index(['createdAt'])
export class PageView {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  page: string;

  @Column({ length: 64, nullable: true, comment: 'Random ID stored in sessionStorage — one per browser tab session' })
  sessionId: string;

  @CreateDateColumn()
  createdAt: Date;
}
