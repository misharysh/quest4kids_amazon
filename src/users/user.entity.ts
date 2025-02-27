import { Exclude, Expose } from "class-transformer";
import { Task } from "../tasks/task.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "./role.enum";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    @Expose()
    id: string;

    @Column()
    @Expose()
    name: string;

    @Column()
    @Expose()
    email: string;

    @Column({select: false})
    password: string;

    @CreateDateColumn()
    @Expose()
    createdAt: Date;

    @UpdateDateColumn()
    @Expose()
    updatedAt: Date;

    @OneToMany(() => Task, task => task.user)
    @Expose()
    tasks: Task[];

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.CHILD
    })
    @Expose()
    role: Role;

    @Column({
        nullable: true
    })
    @Expose()
    parentId?: string;
}