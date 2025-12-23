import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { StoresModule } from './modules/stores/stores.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { PaymentModule } from './modules/payment/payment.module';

// Shared modules
import { PrismaModule } from './shared/prisma/prisma.module';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // Rate limiting
        ThrottlerModule.forRoot([{
            ttl: 60000, // 1 minute
            limit: 100, // 100 requests per minute
        }]),

        // Database
        PrismaModule,

        // Feature modules
        AuthModule,
        UsersModule,
        ProductsModule,
        CategoriesModule,
        StoresModule,
        CartModule,
        OrdersModule,
        ReviewsModule,
        WishlistModule,
        PaymentModule,
    ],
})
export class AppModule { }
