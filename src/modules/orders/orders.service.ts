import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

// Inline helper function to avoid ESM import issues
function generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `INV/${year}${month}${day}/${random}`;
}

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    async getUserOrders(userId: number, status?: string) {
        return this.prisma.order.findMany({
            where: {
                userId,
                ...(status && { status: status as any }),
            },
            include: {
                items: {
                    include: {
                        product: { include: { images: { take: 1 } } },
                    },
                },
                store: { select: { id: true, name: true, slug: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getOrderById(id: number, userId: number) {
        return this.prisma.order.findFirst({
            where: { id, userId },
            include: {
                items: {
                    include: {
                        product: { include: { images: true } },
                        variant: true,
                    },
                },
                store: true,
                address: true,
                voucher: true,
            },
        });
    }

    async createOrder(userId: number, data: {
        storeId: number;
        addressId: number;
        voucherId?: number;
        items: Array<{
            productId: number;
            variantId?: number;
            quantity: number;
        }>;
        courier: string;
        courierService: string;
        shippingCost: number;
        paymentMethod: any;
        notes?: string;
    }) {
        // Get products and calculate totals
        const products = await this.prisma.product.findMany({
            where: { id: { in: data.items.map(i => i.productId) } },
            include: { variants: true },
        });

        let subtotal = 0;
        const orderItems = data.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            const variant = item.variantId
                ? product?.variants.find(v => v.id === item.variantId)
                : null;

            const price = variant?.price || product!.price;
            const finalPrice = Math.round(price * (1 - (product!.discount || 0) / 100));

            subtotal += finalPrice * item.quantity;

            return {
                productId: item.productId,
                variantId: item.variantId,
                productName: product!.title,
                variantName: variant?.value,
                price: finalPrice,
                quantity: item.quantity,
                weight: product!.weight,
            };
        });

        const totalAmount = subtotal + data.shippingCost;

        return this.prisma.order.create({
            data: {
                orderNumber: generateOrderNumber(),
                userId,
                storeId: data.storeId,
                addressId: data.addressId,
                voucherId: data.voucherId,
                subtotal,
                shippingCost: data.shippingCost,
                totalAmount,
                courier: data.courier,
                courierService: data.courierService,
                paymentMethod: data.paymentMethod,
                notes: data.notes,
                items: {
                    create: orderItems,
                },
            },
            include: {
                items: true,
            },
        });
    }
}
