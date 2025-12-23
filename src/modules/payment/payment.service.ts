import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Xendit from 'xendit-node';

@Injectable()
export class PaymentService {
    private xendit: Xendit;

    constructor(private configService: ConfigService) {
        this.xendit = new Xendit({
            secretKey: this.configService.get('XENDIT_SECRET_KEY') || '',
        });
    }

    /**
     * Create Virtual Account payment
     */
    async createVirtualAccount(data: {
        externalId: string;
        bankCode: string;
        name: string;
        amount: number;
        description?: string;
    }) {
        const { VirtualAcc } = this.xendit;
        const va = new VirtualAcc({});

        const response = await va.createFixedVA({
            externalID: data.externalId,
            bankCode: data.bankCode,
            name: data.name,
            expectedAmt: data.amount,
            isClosed: true,
            isSingleUse: true,
            expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });

        return {
            id: response.id,
            externalId: response.external_id,
            bankCode: response.bank_code,
            accountNumber: response.account_number,
            name: response.name,
            amount: response.expected_amount,
            expirationDate: response.expiration_date,
            status: response.status,
        };
    }

    /**
     * Create E-Wallet payment (OVO, DANA, LinkAja, ShopeePay)
     */
    async createEwalletCharge(data: {
        externalId: string;
        amount: number;
        channelCode: 'ID_OVO' | 'ID_DANA' | 'ID_LINKAJA' | 'ID_SHOPEEPAY' | 'ID_GOPAY';
        mobileNumber?: string;
        successRedirectUrl?: string;
        failureRedirectUrl?: string;
    }) {
        const { EWallet } = this.xendit;
        const ewallet = new EWallet({});

        const channelProperties: any = {};

        if (data.channelCode === 'ID_OVO' && data.mobileNumber) {
            channelProperties.mobile_number = data.mobileNumber;
        } else if (data.successRedirectUrl) {
            channelProperties.success_redirect_url = data.successRedirectUrl;
            channelProperties.failure_redirect_url = data.failureRedirectUrl || data.successRedirectUrl;
        }

        const response = await ewallet.createEWalletCharge({
            referenceID: data.externalId,
            currency: 'IDR',
            amount: data.amount,
            checkoutMethod: 'ONE_TIME_PAYMENT',
            channelCode: data.channelCode,
            channelProperties,
        });

        return {
            id: response.id,
            referenceId: response.reference_id,
            chargeAmount: response.charge_amount,
            status: response.status,
            channelCode: response.channel_code,
            actions: response.actions,
        };
    }

    /**
     * Create QRIS payment
     */
    async createQRISPayment(data: {
        externalId: string;
        amount: number;
        description?: string;
    }) {
        const { QrCode } = this.xendit;
        const qr = new QrCode({});

        const response = await qr.createCode({
            externalID: data.externalId,
            type: 'DYNAMIC',
            callbackURL: this.configService.get('XENDIT_CALLBACK_URL') + '/payment/callback/qris',
            amount: data.amount,
        });

        return {
            id: response.id,
            externalId: response.external_id,
            qrString: response.qr_string,
            amount: response.amount,
            status: response.status,
        };
    }

    /**
     * Create Invoice (multi-payment method)
     */
    async createInvoice(data: {
        externalId: string;
        amount: number;
        payerEmail: string;
        description: string;
        successRedirectUrl?: string;
        failureRedirectUrl?: string;
        items?: Array<{
            name: string;
            quantity: number;
            price: number;
        }>;
    }) {
        const { Invoice } = this.xendit;
        const invoice = new Invoice({});

        const response = await invoice.createInvoice({
            externalID: data.externalId,
            amount: data.amount,
            payerEmail: data.payerEmail,
            description: data.description,
            successRedirectURL: data.successRedirectUrl,
            failureRedirectURL: data.failureRedirectUrl,
            invoiceDuration: 86400, // 24 hours in seconds
            currency: 'IDR',
            items: data.items,
            paymentMethods: ['BCA', 'BNI', 'BRI', 'MANDIRI', 'PERMATA', 'OVO', 'DANA', 'SHOPEEPAY', 'LINKAJA', 'QRIS'],
        });

        return {
            id: response.id,
            externalId: response.external_id,
            invoiceUrl: response.invoice_url,
            status: response.status,
            amount: response.amount,
            expiryDate: response.expiry_date,
        };
    }

    /**
     * Get Invoice status
     */
    async getInvoiceStatus(invoiceId: string) {
        const { Invoice } = this.xendit;
        const invoice = new Invoice({});

        const response = await invoice.getInvoice({ invoiceID: invoiceId });

        return {
            id: response.id,
            externalId: response.external_id,
            status: response.status,
            amount: response.amount,
            paidAmount: response.paid_amount,
            paidAt: response.paid_at,
            paymentMethod: response.payment_method,
            paymentChannel: response.payment_channel,
        };
    }

    /**
     * Get available Virtual Account banks
     */
    getAvailableBanks() {
        return [
            { code: 'BCA', name: 'Bank Central Asia' },
            { code: 'BNI', name: 'Bank Negara Indonesia' },
            { code: 'BRI', name: 'Bank Rakyat Indonesia' },
            { code: 'MANDIRI', name: 'Bank Mandiri' },
            { code: 'PERMATA', name: 'Bank Permata' },
            { code: 'BSI', name: 'Bank Syariah Indonesia' },
            { code: 'BJB', name: 'Bank Jabar Banten' },
            { code: 'CIMB', name: 'CIMB Niaga' },
        ];
    }

    /**
     * Get available E-Wallets
     */
    getAvailableEwallets() {
        return [
            { code: 'ID_OVO', name: 'OVO', requiresPhone: true },
            { code: 'ID_DANA', name: 'DANA', requiresPhone: false },
            { code: 'ID_SHOPEEPAY', name: 'ShopeePay', requiresPhone: false },
            { code: 'ID_LINKAJA', name: 'LinkAja', requiresPhone: false },
            { code: 'ID_GOPAY', name: 'GoPay', requiresPhone: false },
        ];
    }
}
