import { Controller, Delete, Get, Param, Patch } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { Roles } from "src/users/decorators/roles.decorator";
import { Role } from "src/users/role.enum";
import { CurrentUser } from "src/users/decorators/current-user.decorator";
import { CurrentUserDto } from "src/users/dto/current-user.dto";

@Controller('notifications')
export class NotificationController
{
    constructor(
        private readonly notificationService: NotificationService
    ) {};

    @Get()
    @Roles(Role.PARENT)
    public async getAll(@CurrentUser() currentUser: CurrentUserDto)
    {
        return this.notificationService.getUserNotifications(currentUser.id);
    };

    @Get('unread')
    @Roles(Role.PARENT)
    public async getUnread(@CurrentUser() currentUser: CurrentUserDto)
    {
        return this.notificationService.getUnreadUserNotifications(currentUser.id);
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