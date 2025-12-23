import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class ReviewsService {
    constructor(private prisma: PrismaService) { }

    async getProductReviews(productId: number, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { productId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, fullName: true, avatar: true } },
                },
            }),
            this.prisma.review.count({ where: { productId } }),
        ]);

        return {
            data: reviews,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async createReview(userId: number, productId: number, data: {
        rating: number;
        comment?: string;
        images?: string[];
    }) {
        return this.prisma.review.create({
            data: {
                userId,
                productId,
                rating: data.rating,
                comment: data.comment,
                images: data.images,
                isVerified: true, // Assume verified purchase for now
            },
        });
    }
}
