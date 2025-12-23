import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    @Get('methods')
    @ApiOperation({ summary: 'Get available payment methods' })
    getPaymentMethods() {
        return {
            virtualAccounts: this.paymentService.getAvailableBanks(),
            ewallets: this.paymentService.getAvailableEwallets(),
            qris: { available: true, name: 'QRIS' },
        };
    }

    @Post('invoice')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create payment invoice for order' })
    async createInvoice(
        @Request() req,
        @Body()
        body: {
            orderId: number;
        },
    ) {
        const userId = req.user.sub;

        // Get order details
        const order = await this.prisma.order.findFirst({
            where: { id: body.orderId, userId },
            include: {
                user: true,
                items: {
                    include: { product: true },
                },
            },
        });

        if (!order) {
            throw new Error('Order not found');
        }

        // Create Xendit invoice
        const invoice = await this.paymentService.createInvoice({
            externalId: order.orderNumber,
            amount: order.totalAmount,
            payerEmail: order.user.email,
            description: `Pembayaran order ${order.orderNumber}`,
            successRedirectUrl: `${this.configService.get('APP_URL')}/payment/success?order=${order.orderNumber}`,
            failureRedirectUrl: `${this.configService.get('APP_URL')}/payment/failed?order=${order.orderNumber}`,
            items: order.items.map((item) => ({
                name: item.productName,
                quantity: item.quantity,
                price: item.price,
            })),
        });

        // Update order with payment info
        await this.prisma.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: 'PENDING',
                notes: `Xendit Invoice: ${invoice.id}`,
            },
        });

        return {
            invoiceId: invoice.id,
            invoiceUrl: invoice.invoiceUrl,
            expiryDate: invoice.expiryDate,
            amount: invoice.amount,
        };
    }

    @Post('virtual-account')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create Virtual Account payment' })
    async createVirtualAccount(
        @Request() req,
        @Body()
        body: {
            orderId: number;
            bankCode: string;
        },
    ) {
        const userId = req.user.sub;

        const order = await this.prisma.order.findFirst({
            where: { id: body.orderId, userId },
            include: { user: true },
        });

        if (!order) {
            throw new Error('Order not found');
        }

        const va = await this.paymentService.createVirtualAccount({
            externalId: order.orderNumber,
            bankCode: body.bankCode,
            name: order.user.fullName,
            amount: order.totalAmount,
            description: `Pembayaran ${order.orderNumber}`,
        });

        await this.prisma.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: 'PENDING',
                notes: `VA: ${va.accountNumber} (${va.bankCode})`,
            },
        });

        return va;
    }

    @Post('ewallet')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create E-Wallet payment' })
    async createEwalletPayment(
        @Request() req,
        @Body()
        body: {
            orderId: number;
            channelCode: 'ID_OVO' | 'ID_DANA' | 'ID_LINKAJA' | 'ID_SHOPEEPAY' | 'ID_GOPAY';
            mobileNumber?: string;
        },
    ) {
        const userId = req.user.sub;

        const order = await this.prisma.order.findFirst({
            where: { id: body.orderId, userId },
        });

        if (!order) {
            throw new Error('Order not found');
        }

        const charge = await this.paymentService.createEwalletCharge({
            externalId: order.orderNumber,
            amount: order.totalAmount,
            channelCode: body.channelCode,
            mobileNumber: body.mobileNumber,
            successRedirectUrl: `${this.configService.get('APP_URL')}/payment/success?order=${order.orderNumber}`,
            failureRedirectUrl: `${this.configService.get('APP_URL')}/payment/failed?order=${order.orderNumber}`,
        });

        await this.prisma.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: 'PENDING',
                notes: `E-Wallet: ${charge.channelCode}`,
            },
        });

        return charge;
    }

    @Post('qris')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create QRIS payment' })
    async createQRISPayment(
        @Request() req,
        @Body()
        body: {
            orderId: number;
        },
    ) {
        const userId = req.user.sub;

        const order = await this.prisma.order.findFirst({
            where: { id: body.orderId, userId },
        });

        if (!order) {
            throw new Error('Order not found');
        }

        const qris = await this.paymentService.createQRISPayment({
            externalId: order.orderNumber,
            amount: order.totalAmount,
            description: `Pembayaran ${order.orderNumber}`,
        });

        await this.prisma.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: 'PENDING',
                notes: `QRIS ID: ${qris.id}`,
            },
        });

        return qris;
    }

    @Get('status/:orderId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check payment status' })
    async getPaymentStatus(@Request() req, @Param('orderId') orderId: string) {
        const order = await this.prisma.order.findFirst({
            where: { id: parseInt(orderId), userId: req.user.sub },
        });

        if (!order) {
            throw new Error('Order not found');
        }

        return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentStatus: order.paymentStatus,
            paidAt: order.paidAt,
        };
    }

    /**
     * Webhook callback from Xendit
     */
    @Post('callback/invoice')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Xendit invoice callback webhook' })
    async handleInvoiceCallback(
        @Headers('x-callback-token') callbackToken: string,
        @Body() payload: any,
    ) {
        // Verify callback token
        const expectedToken = this.configService.get('XENDIT_CALLBACK_TOKEN');
        if (callbackToken !== expectedToken) {
            throw new Error('Invalid callback token');
        }

        const { external_id, status, paid_amount, paid_at, payment_method, payment_channel } = payload;

        if (status === 'PAID') {
            await this.prisma.order.updateMany({
                where: { orderNumber: external_id },
                data: {
                    paymentStatus: 'PAID',
                    status: 'PAID',
                    paidAt: new Date(paid_at),
                },
            });
        } else if (status === 'EXPIRED') {
            await this.prisma.order.updateMany({
                where: { orderNumber: external_id },
                data: {
                    paymentStatus: 'EXPIRED',
                },
            });
        }

        return { status: 'OK' };
    }

    @Post('callback/va')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Xendit VA callback webhook' })
    async handleVACallback(
        @Headers('x-callback-token') callbackToken: string,
        @Body() payload: any,
    ) {
        const expectedToken = this.configService.get('XENDIT_CALLBACK_TOKEN');
        if (callbackToken !== expectedToken) {
            throw new Error('Invalid callback token');
        }

        const { external_id, payment_id, amount } = payload;

        await this.prisma.order.updateMany({
            where: { orderNumber: external_id },
            data: {
                paymentStatus: 'PAID',
                status: 'PAID',
                paidAt: new Date(),
            },
        });

        return { status: 'OK' };
    }

    @Post('callback/ewallet')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Xendit E-Wallet callback webhook' })
    async handleEwalletCallback(
        @Headers('x-callback-token') callbackToken: string,
        @Body() payload: any,
    ) {
        const expectedToken = this.configService.get('XENDIT_CALLBACK_TOKEN');
        if (callbackToken !== expectedToken) {
            throw new Error('Invalid callback token');
        }

        const { data } = payload;
        const { reference_id, status } = data;

        if (status === 'SUCCEEDED') {
            await this.prisma.order.updateMany({
                where: { orderNumber: reference_id },
                data: {
                    paymentStatus: 'PAID',
                    status: 'PAID',
                    paidAt: new Date(),
                },
            });
        }

        return { status: 'OK' };
    }
}
