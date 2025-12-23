import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: {
        page?: number;
        limit?: number;
        search?: string;
        categoryId?: number;
        brandId?: number;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
        storeId?: number;
    }) {
        const {
            page = 1,
            limit = 20,
            search,
            categoryId,
            brandId,
            minPrice,
            maxPrice,
            sortBy = 'newest',
            storeId,
        } = params;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {
            moderationStatus: 'APPROVED',
            store: {
                status: 'ACTIVE',
                isOnHoliday: false,
            },
        };

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
            ];
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (brandId) {
            where.brandId = brandId;
        }

        if (storeId) {
            where.storeId = storeId;
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = minPrice;
            if (maxPrice !== undefined) where.price.lte = maxPrice;
        }

        // Build order by
        let orderBy: any = { createdAt: 'desc' };
        switch (sortBy) {
            case 'price_asc':
                orderBy = { price: 'asc' };
                break;
            case 'price_desc':
                orderBy = { price: 'desc' };
                break;
            case 'popular':
                orderBy = { soldCount: 'desc' };
                break;
            case 'newest':
            default:
                orderBy = { createdAt: 'desc' };
        }

        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    images: { take: 1, orderBy: { order: 'asc' } },
                    category: { select: { id: true, name: true, slug: true } },
                    brand: { select: { id: true, name: true, slug: true } },
                    store: { select: { id: true, name: true, slug: true, city: true, isVerified: true } },
                    _count: { select: { reviews: true } },
                },
            }),
            this.prisma.product.count({ where }),
        ]);

        // Calculate average ratings
        const productsWithRating = await Promise.all(
            products.map(async (product) => {
                const ratingAgg = await this.prisma.review.aggregate({
                    where: { productId: product.id },
                    _avg: { rating: true },
                });

                return {
                    ...product,
                    rating: ratingAgg._avg.rating || 0,
                    reviewCount: product._count.reviews,
                    finalPrice: Math.round(product.price * (1 - product.discount / 100)),
                };
            }),
        );

        return {
            data: productsWithRating,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findBySlug(slug: string) {
        const product = await this.prisma.product.findFirst({
            where: { slug },
            include: {
                images: { orderBy: { order: 'asc' } },
                variants: true,
                category: true,
                brand: true,
                store: {
                    include: {
                        _count: { select: { products: true } },
                    },
                },
                reviews: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: { select: { id: true, fullName: true, avatar: true } },
                    },
                },
                _count: { select: { reviews: true } },
            },
        });

        if (!product) {
            throw new NotFoundException('Produk tidak ditemukan');
        }

        // Get rating
        const ratingAgg = await this.prisma.review.aggregate({
            where: { productId: product.id },
            _avg: { rating: true },
        });

        return {
            ...product,
            rating: ratingAgg._avg.rating || 0,
            reviewCount: product._count.reviews,
            finalPrice: Math.round(product.price * (1 - product.discount / 100)),
        };
    }

    async findById(id: number) {
        return this.prisma.product.findUnique({
            where: { id },
            include: {
                images: true,
                variants: true,
                category: true,
                brand: true,
                store: true,
            },
        });
    }

    // Flash sale products
    async getFlashSaleProducts(limit = 10) {
        return this.prisma.product.findMany({
            where: {
                isFlashSale: true,
                moderationStatus: 'APPROVED',
                store: { status: 'ACTIVE', isOnHoliday: false },
            },
            take: limit,
            include: {
                images: { take: 1 },
                store: { select: { name: true, city: true } },
            },
        });
    }

    // Featured/Popular products
    async getFeaturedProducts(limit = 10) {
        return this.prisma.product.findMany({
            where: {
                moderationStatus: 'APPROVED',
                store: { status: 'ACTIVE', isOnHoliday: false },
            },
            orderBy: { soldCount: 'desc' },
            take: limit,
            include: {
                images: { take: 1 },
                store: { select: { name: true, city: true } },
            },
        });
    }

    // New arrivals
    async getNewArrivals(limit = 10) {
        return this.prisma.product.findMany({
            where: {
                moderationStatus: 'APPROVED',
                store: { status: 'ACTIVE', isOnHoliday: false },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                images: { take: 1 },
                store: { select: { name: true, city: true } },
            },
        });
    }
}
