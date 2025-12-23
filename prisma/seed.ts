import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@suastore.com' },
        update: {},
        create: {
            email: 'admin@suastore.com',
            name: 'Admin SuaStore',
            password: adminPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
        },
    });
    console.log('✅ Admin user created');

    // Create Demo Seller
    const sellerPassword = await bcrypt.hash('seller123', 10);
    const seller = await prisma.user.upsert({
        where: { email: 'seller@suastore.com' },
        update: {},
        create: {
            email: 'seller@suastore.com',
            name: 'Demo Seller',
            password: sellerPassword,
            role: 'SELLER',
            status: 'ACTIVE',
        },
    });
    console.log('✅ Seller user created');

    // Create Demo Buyer
    const buyerPassword = await bcrypt.hash('buyer123', 10);
    const buyer = await prisma.user.upsert({
        where: { email: 'buyer@suastore.com' },
        update: {},
        create: {
            email: 'buyer@suastore.com',
            name: 'Demo Buyer',
            password: buyerPassword,
            role: 'BUYER',
            status: 'ACTIVE',
        },
    });
    console.log('✅ Buyer user created');

    // Create Store
    const store = await prisma.store.upsert({
        where: { slug: 'demo-store' },
        update: {},
        create: {
            name: 'Demo Store Official',
            slug: 'demo-store',
            description: 'Official demo store for SuaStore marketplace',
            ownerId: seller.id,
            isVerified: true,
            status: 'ACTIVE',
            city: 'Jakarta',
            province: 'DKI Jakarta',
        },
    });
    console.log('✅ Demo store created');

    // Create Categories
    const categories = [
        { name: 'Electronics', slug: 'electronics' },
        { name: 'Fashion', slug: 'fashion' },
        { name: 'Home & Living', slug: 'home-living' },
        { name: 'Beauty', slug: 'beauty' },
        { name: 'Sports', slug: 'sports' },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        });
    }
    console.log('✅ Categories created');

    // Create Products
    const electronics = await prisma.category.findUnique({ where: { slug: 'electronics' } });

    const products = [
        {
            title: 'iPhone 15 Pro Max 256GB',
            slug: 'iphone-15-pro-max-256gb',
            description: 'Latest iPhone with A17 Pro chip',
            price: 22499100,
            stock: 50,
            storeId: store.id,
            categoryId: electronics?.id,
        },
        {
            title: 'MacBook Pro M3 14"',
            slug: 'macbook-pro-m3-14',
            description: 'Powerful laptop with M3 chip',
            price: 34999000,
            stock: 25,
            storeId: store.id,
            categoryId: electronics?.id,
        },
        {
            title: 'AirPods Pro 2nd Gen',
            slug: 'airpods-pro-2',
            description: 'Premium wireless earbuds',
            price: 3999000,
            stock: 100,
            storeId: store.id,
            categoryId: electronics?.id,
        },
    ];

    for (const product of products) {
        await prisma.product.upsert({
            where: { slug: product.slug },
            update: {},
            create: {
                ...product,
                moderationStatus: 'APPROVED',
                status: 'ACTIVE',
            },
        });
    }
    console.log('✅ Demo products created');

    console.log('🎉 Database seeding completed!');
    console.log('\nDemo Accounts:');
    console.log('  Admin: admin@suastore.com / admin123');
    console.log('  Seller: seller@suastore.com / seller123');
    console.log('  Buyer: buyer@suastore.com / buyer123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
