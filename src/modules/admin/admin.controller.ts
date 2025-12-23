import { Controller, Get, Post, Query, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// TODO: Add AdminGuard to check for admin role
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(private adminService: AdminService) { }

    @Get('dashboard')
    async getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    // Users
    @Get('users')
    async getUsers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('role') role?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        return this.adminService.getUsers(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            { role, status, search },
        );
    }

    @Post('users/:id/ban')
    async banUser(@Param('id') id: string) {
        await this.adminService.banUser(id);
        return { success: true };
    }

    @Post('users/:id/unban')
    async unbanUser(@Param('id') id: string) {
        await this.adminService.unbanUser(id);
        return { success: true };
    }

    // Stores
    @Get('stores')
    async getStores(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        return this.adminService.getStores(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            { status, search },
        );
    }

    @Post('stores/:id/verify')
    async verifyStore(@Param('id') id: string) {
        await this.adminService.verifyStore(id);
        return { success: true };
    }

    @Post('stores/:id/suspend')
    async suspendStore(@Param('id') id: string) {
        await this.adminService.suspendStore(id);
        return { success: true };
    }

    // Products
    @Get('products')
    async getProducts(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('moderationStatus') moderationStatus?: string,
        @Query('search') search?: string,
    ) {
        return this.adminService.getProducts(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            { moderationStatus, search },
        );
    }

    @Post('products/:id/approve')
    async approveProduct(@Param('id') id: string) {
        await this.adminService.approveProduct(id);
        return { success: true };
    }

    @Post('products/:id/reject')
    async rejectProduct(@Param('id') id: string, @Body() body: { reason: string }) {
        await this.adminService.rejectProduct(id, body.reason);
        return { success: true };
    }

    // Orders
    @Get('orders')
    async getOrders(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        return this.adminService.getOrders(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            { status, search },
        );
    }

    // Reports
    @Get('reports/revenue')
    async getRevenueReport(@Query('year') year?: string) {
        return this.adminService.getRevenueReport(year ? parseInt(year) : new Date().getFullYear());
    }
}
