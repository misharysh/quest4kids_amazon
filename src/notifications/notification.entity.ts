import { User } from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Notification
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, {nullable: false})
    user: User;

    @Column()
    userId: string;

    @Column('text')
    message: string;

    @Column({default: false})
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;
}