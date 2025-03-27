import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Task } from "./../tasks/task.entity";

@Entity()
export class UserTaskCompletion
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.completedTasks, {onDelete: 'CASCADE'})
    user: User;

    @ManyToOne(() => Task, (task) => task.completions, {onDelete: 'CASCADE'})
    task: Task;

    @Column({type: 'int', default: 0})
    points: number;
}