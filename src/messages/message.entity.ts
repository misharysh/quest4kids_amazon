import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    senderId: string;

    @Column()
    receiverId: string;

    @Column('text')
    content: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({default: false})
    isRead: boolean;
}