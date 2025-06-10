import { Controller, Delete, Get, Param, Patch, Query } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { Roles } from "../users/decorators/roles.decorator";
import { Role } from "../users/role.enum";
import { CurrentUser } from "../users/decorators/current-user.decorator";
import { CurrentUserDto } from "../users/dto/current-user.dto";
import { FindNotificationParams } from "./dto/find-notification.params";

@Controller('notifications')
export class NotificationController
{
    constructor(
        private readonly notificationService: NotificationService
    ) {};

    @Get()
    @Roles(Role.PARENT)
    public async getAll(
        @Query() filters: FindNotificationParams,
        @CurrentUser() currentUser: CurrentUserDto)
    {
        return this.notificationService.getUserNotifications(currentUser.id, filters);
    };

    @Patch(':id/read')
    @Roles(Role.PARENT)
    public async markAsRead(@Param('id') id: string)
    {
        await this.notificationService.markAsRead(id);

        return {message: 'Notification marked as read.'};
    };

    @Delete(':id')
    @Roles(Role.PARENT)
    public async delete(@Param('id') id: string)
    {
        await this.notificationService.delete(id);
    };
}