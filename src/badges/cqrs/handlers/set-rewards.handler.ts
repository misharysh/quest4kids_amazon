import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { SetRewardCommand } from "../commands/set-rewards.command";
import { InjectRepository } from "@nestjs/typeorm";
import { UserTaskCompletion } from "src/users/user-task-completion.entity";
import { Badge } from "src/badges/badge.entity";
import { UserBadge } from "src/badges/user-badge.entity";
import { Repository } from "typeorm";

@CommandHandler(SetRewardCommand)
export class SetRewardHandler implements ICommandHandler<SetRewardCommand, void> {

    constructor(
        @InjectRepository(UserTaskCompletion)
        private userTaskCompletionsRepository: Repository<UserTaskCompletion>,
        @InjectRepository(Badge)
        private badgeRepository: Repository<Badge>,
        @InjectRepository(UserBadge)
        private userBadgeRepository: Repository<UserBadge>,
    ) {}

    async execute(command: SetRewardCommand): Promise<void> {
        const {labels, userId} = command;
        
        if (labels.length === 0) return;

        for (const label of labels) {
            const { total } = await this.userTaskCompletionsRepository
            .createQueryBuilder('completion')
            .leftJoin('completion.task', 'task')
            .leftJoin('task.labels', 'label')
            .where('completion.userId = :userId', { userId: userId })
            .andWhere('label.name = :labelName', { labelName: label.name })
            .select('COALESCE(SUM(completion.points), 0)', 'total')
            .getRawOne();

            console.log(total + ' ' + label.name);

            const badge = await this.badgeRepository.findOne({
            where: { label: label.name },
            });

            if (badge && total >= badge.requiredPoints) {
                const existingUserBadge = await this.userBadgeRepository.findOne({
                    where: { user: { id: userId }, badge: { id: badge.id } },
                });

                if (!existingUserBadge) {
                    await this.userBadgeRepository.save({
                    user: { id: userId },
                    badge,
                    });
                }
            }
        }
    }
}