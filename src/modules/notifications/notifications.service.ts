import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export type NotificationType =
    | 'ORDER_CREATED'
    | 'ORDER_PAID'
    | 'ORDER_SHIPPED'
    | 'ORDER_DELIVERED'
    | 'ORDER_CANCELLED'
    | 'PRODUCT_REVIEW'
    | 'NEW_MESSAGE'
    | 'PROMO'
    | 'SYSTEM';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        link?: string;
        metadata?: any;
    }) {
        return this.prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link,
                metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            },
        });
    }

    async getByUser(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({ where: { userId } }),
        ]);

        return {
            data: notifications,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getUnreadCount(userId: string) {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }

    async markAsRead(notificationId: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    async delete(notificationId: string, userId: string) {
        return this.prisma.notification.deleteMany({
            where: { id: notificationId, userId },
        });
    }

    // Helper methods for common notifications
    async notifyOrderCreated(userId: string, orderId: string) {
        return this.create({
            userId,
            type: 'ORDER_CREATED',
            title: 'Pesanan Dibuat',
            message: `Pesanan #${orderId} berhasil dibuat. Silakan selesaikan pembayaran.`,
            link: `/profile/orders/${orderId}`,
        });
    }

    async notifyOrderShipped(userId: string, orderId: string, trackingNumber: string) {
        return this.create({
            userId,
            type: 'ORDER_SHIPPED',
            title: 'Pesanan Dikirim',
            message: `Pesanan #${orderId} sedang dalam pengiriman. Resi: ${trackingNumber}`,
            link: `/profile/orders/${orderId}/tracking`,
        });
    }

    async notifyNewMessage(userId: string, senderName: string, conversationId: string) {
        return this.create({
            userId,
            type: 'NEW_MESSAGE',
            title: 'Pesan Baru',
            message: `${senderName}: mengirim pesan baru`,
            link: `/chat?conversation=${conversationId}`,
        });
    }
}
