import { Controller, Get, Post, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    @Get()
    async getNotifications(
        @Req() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.notificationsService.getByUser(
            req.user.sub,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        );
    }

    @Get('unread-count')
    async getUnreadCount(@Req() req: any) {
        const count = await this.notificationsService.getUnreadCount(req.user.sub);
        return { count };
    }

    @Post(':id/read')
    async markAsRead(@Param('id') id: string, @Req() req: any) {
        await this.notificationsService.markAsRead(id, req.user.sub);
        return { success: true };
    }

    @Post('read-all')
    async markAllAsRead(@Req() req: any) {
        await this.notificationsService.markAllAsRead(req.user.sub);
        return { success: true };
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Req() req: any) {
        await this.notificationsService.delete(id, req.user.sub);
        return { success: true };
    }
}
