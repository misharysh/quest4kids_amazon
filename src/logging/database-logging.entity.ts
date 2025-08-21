import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { LogLevel } from "./log-level.enum";

@Entity('logs')
export class DatabaseLogEntity
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    timestamp: Date;

    @Column({type: 'enum', enum:LogLevel})
    level: LogLevel;

    @Column()
    category: string;

    @Column()
    message: string;

    @Column({ type: 'jsonb', nullable: true })
    properties?: object;
}