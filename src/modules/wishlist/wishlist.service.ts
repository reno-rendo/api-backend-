import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class WishlistService {
    constructor(private prisma: PrismaService) { }

    async getWishlist(userId: number) {
        return this.prisma.wishlist.findMany({
            where: { userId },
            include: {
                product: {
                    include: {
                        images: { take: 1 },
                        store: { select: { name: true, city: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async addToWishlist(userId: number, productId: number) {
        return this.prisma.wishlist.upsert({
            where: {
                userId_productId: { userId, productId },
            },
            create: { userId, productId },
            update: {},
        });
    }

    async removeFromWishlist(userId: number, productId: number) {
        return this.prisma.wishlist.delete({
            where: {
                userId_productId: { userId, productId },
            },
        });
    }

    async isInWishlist(userId: number, productId: number) {
        const item = await this.prisma.wishlist.findUnique({
            where: {
                userId_productId: { userId, productId },
            },
        });
        return !!item;
    }
}
