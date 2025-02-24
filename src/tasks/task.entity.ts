import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TaskStatus } from "./task.model";
import { User } from "../users/user.entity";
import { TaskLabel } from "./task-label.entity";

@Entity()
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column({
        type: "varchar",
        length: 100,
        nullable: false
    })
    title: string;

    @Column({
        type: 'text',
        nullable: false
    })
    description: string;

    @Column({
        type: 'enum',
        enum: TaskStatus,
        default: TaskStatus.OPEN
    })
    status: TaskStatus;

    @Column({
        nullable: true
    })
    points?: number;

    @Column()
    userId: string;

    @ManyToOne(() => User, user => user.tasks, {nullable: false})
    user: User;

    @OneToMany(() => TaskLabel, label => label.task, {
        cascade: true
    })
    labels: TaskLabel[];
}