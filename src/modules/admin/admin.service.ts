import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    // Dashboard Stats
    async getDashboardStats() {
        const [userCount, productCount, storeCount, orderCount] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.product.count(),
            this.prisma.store.count(),
            this.prisma.order.count(),
        ]);

        const totalRevenue = await this.prisma.order.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { totalAmount: true },
        });

        return {
            users: userCount,
            products: productCount,
            stores: storeCount,
            orders: orderCount,
            revenue: totalRevenue._sum.totalAmount || 0,
        };
    }

    // User Management
    async getUsers(page = 1, limit = 20, filters?: { role?: string; status?: string; search?: string }) {
        const skip = (page - 1) * limit;
        const where: any = {};

        if (filters?.role) where.role = filters.role;
        if (filters?.status) where.status = filters.status;
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search } },
                { email: { contains: filters.search } },
            ];
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return { data: users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async banUser(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { status: 'BANNED' },
        });
    }

    async unbanUser(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { status: 'ACTIVE' },
        });
    }

    // Store Management
    async getStores(page = 1, limit = 20, filters?: { status?: string; search?: string }) {
        const skip = (page - 1) * limit;
        const where: any = {};

        if (filters?.status) where.status = filters.status;
        if (filters?.search) where.name = { contains: filters.search };

        const [stores, total] = await Promise.all([
            this.prisma.store.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
            this.prisma.store.count({ where }),
        ]);

        return { data: stores, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async verifyStore(storeId: string) {
        return this.prisma.store.update({
            where: { id: storeId },
            data: { isVerified: true },
        });
    }

    async suspendStore(storeId: string) {
        return this.prisma.store.update({
            where: { id: storeId },
            data: { status: 'SUSPENDED' },
        });
    }

    // Product Moderation
    async getProducts(page = 1, limit = 20, filters?: { moderationStatus?: string; search?: string }) {
        const skip = (page - 1) * limit;
        const where: any = {};

        if (filters?.moderationStatus) where.moderationStatus = filters.moderationStatus;
        if (filters?.search) where.title = { contains: filters.search };

        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: { store: { select: { name: true } } },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.product.count({ where }),
        ]);

        return { data: products, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async approveProduct(productId: string) {
        return this.prisma.product.update({
            where: { id: productId },
            data: { moderationStatus: 'APPROVED' },
        });
    }

    async rejectProduct(productId: string, reason: string) {
        return this.prisma.product.update({
            where: { id: productId },
            data: { moderationStatus: 'REJECTED', moderationNote: reason },
        });
    }

    // Order Management
    async getOrders(page = 1, limit = 20, filters?: { status?: string; search?: string }) {
        const skip = (page - 1) * limit;
        const where: any = {};

        if (filters?.status) where.status = filters.status;
        if (filters?.search) where.orderNumber = { contains: filters.search };

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: { user: { select: { name: true } } },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.order.count({ where }),
        ]);

        return { data: orders, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    // Reports
    async getRevenueReport(year: number) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);

        const orders = await this.prisma.order.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: { gte: startDate, lt: endDate },
            },
            select: { totalAmount: true, createdAt: true },
        });

        // Group by month
        const monthly = Array(12).fill(0);
        orders.forEach(order => {
            const month = order.createdAt.getMonth();
            monthly[month] += Number(order.totalAmount);
        });

        return monthly.map((value, index) => ({
            month: new Date(year, index).toLocaleString('id-ID', { month: 'short' }),
            value,
        }));
    }
}
