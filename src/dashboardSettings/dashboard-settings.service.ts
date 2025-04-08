import { Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { DashboardSettings } from "./dashboard-settings.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/user.entity";
import { DashboardElementDto } from "./dto/save-dashboard.dto";

@Injectable()
export class DashboardSettingsService 
{
    constructor(
        @InjectRepository(DashboardSettings)
        private readonly settingsRepository: Repository<DashboardSettings>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {};

    public async saveOrUpdateLayout(userId: string, layout: DashboardElementDto[])
    {
        const user = await this.userRepository.findOne({where: {id: userId}, relations: ['dashboardSettings']});

        if (!user) throw new NotFoundException('User not found');

        if (!user.dashboardSettings)
        {
            //create dashboard settings
            const newSettings = this.settingsRepository.create({user, layout});
            await this.settingsRepository.save(newSettings);
            user.dashboardSettings = newSettings;
        }
        else
        {
            //update dashboard settings
            user.dashboardSettings.layout = layout;
            await this.settingsRepository.save(user.dashboardSettings);
        }

        return user.dashboardSettings.layout;
    };

    public async getLayout(userId: string)
    {
        const user = await this.userRepository.findOne({where: {id: userId}, relations: ['dashboardSettings']});

        return user?.dashboardSettings?.layout || [];
    };
}