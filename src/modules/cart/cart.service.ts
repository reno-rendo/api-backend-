import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class CartService {
    constructor(private prisma: PrismaService) { }

    async getCart(userId: number) {
        const items = await this.prisma.cartItem.findMany({
            where: { userId },
            include: {
                product: {
                    include: {
                        images: { take: 1 },
                        store: { select: { id: true, name: true, slug: true } },
                    },
                },
                variant: true,
            },
        });

        // Group by store
        const groupedByStore = items.reduce((acc, item) => {
            const storeId = item.product.storeId;
            if (!acc[storeId]) {
                acc[storeId] = {
                    store: item.product.store,
                    items: [],
                };
            }
            acc[storeId].items.push(item);
            return acc;
        }, {} as Record<number, any>);

        return Object.values(groupedByStore);
    }

    async addToCart(userId: number, data: {
        productId: number;
        variantId?: number;
        quantity: number;
        notes?: string;
    }) {
        // Check if product exists and has stock
        const product = await this.prisma.product.findUnique({
            where: { id: data.productId },
            include: { variants: true },
        });

        if (!product) {
            throw new BadRequestException('Produk tidak ditemukan');
        }

        // Check existing cart item
        const existingItem = await this.prisma.cartItem.findFirst({
            where: {
                userId,
                productId: data.productId,
                variantId: data.variantId || null,
            },
        });

        if (existingItem) {
            // Update quantity
            return this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: {
                    quantity: existingItem.quantity + data.quantity,
                    notes: data.notes,
                },
            });
        }

        // Create new cart item
        return this.prisma.cartItem.create({
            data: {
                userId,
                productId: data.productId,
                variantId: data.variantId,
                quantity: data.quantity,
                notes: data.notes,
            },
        });
    }

    async updateCartItem(id: number, userId: number, quantity: number) {
        if (quantity <= 0) {
            return this.removeCartItem(id, userId);
        }

        return this.prisma.cartItem.update({
            where: { id },
            data: { quantity },
        });
    }

    async removeCartItem(id: number, userId: number) {
        return this.prisma.cartItem.delete({
            where: { id },
        });
    }

    async clearCart(userId: number) {
        return this.prisma.cartItem.deleteMany({
            where: { userId },
        });
    }
}
