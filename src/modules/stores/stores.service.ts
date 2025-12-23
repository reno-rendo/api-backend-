import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class StoresService {
    constructor(private prisma: PrismaService) { }

    async findBySlug(slug: string) {
        const store = await this.prisma.store.findUnique({
            where: { slug },
            include: {
                user: { select: { id: true, fullName: true, avatar: true } },
                _count: { select: { products: true } },
            },
        });

        if (!store) {
            throw new NotFoundException('Toko tidak ditemukan');
        }

        return store;
    }

    async getStoreProducts(storeId: number, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where: { storeId, moderationStatus: 'APPROVED' },
                skip,
                take: limit,
                include: {
                    images: { take: 1 },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.product.count({
                where: { storeId, moderationStatus: 'APPROVED' },
            }),
        ]);

        return {
            data: products,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
}
