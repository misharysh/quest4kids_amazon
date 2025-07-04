import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardSettings } from './dashboard-settings.entity';
import { UsersModule } from '../users/users.module';
import { DashboardSettingsController } from './dashboard-settings.controller';
import { DashboardSettingsService } from './dashboard-settings.service';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DashboardSettings, User]), UsersModule],
  controllers: [DashboardSettingsController],
  providers: [DashboardSettingsService],
})
export class DashboardSettingsModule {}
