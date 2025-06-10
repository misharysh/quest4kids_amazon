import { Body, Controller, Get, NotFoundException, Put } from '@nestjs/common';
import { DashboardSettingsService } from './dashboard-settings.service';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/role.enum';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { CurrentUserDto } from '../users/dto/current-user.dto';
import { SaveDashboardDto } from './dto/save-dashboard.dto';
import { UserService } from '../users/user/user.service';

@Controller('dashboard-settings')
export class DashboardSettingsController {
  constructor(
    private readonly dashboardSettingsService: DashboardSettingsService,
    private readonly userService: UserService,
  ) {}

  @Put()
  @Roles(Role.PARENT)
  public async saveLayout(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() saveDashboardDto: SaveDashboardDto,
  ) {
    const user = await this.userService.findOne(currentUser.id);

    if (user) {
      return this.dashboardSettingsService.saveOrUpdateLayout(
        user.id,
        saveDashboardDto.layout,
      );
    }

    throw new NotFoundException();
  }

  @Get()
  @Roles(Role.PARENT)
  public async getLayout(@CurrentUser() currentUser: CurrentUserDto) {
    const user = await this.userService.findOne(currentUser.id);

    if (user) {
      return this.dashboardSettingsService.getLayout(user.id);
    }

    throw new NotFoundException();
  }
}
