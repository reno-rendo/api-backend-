import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Security
    app.use(helmet());
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    });

    // Validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // API Prefix
    app.setGlobalPrefix('api/v1');

    // Swagger Documentation
    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('SuaStore API')
            .setDescription('E-Commerce API untuk SuaStore')
            .setVersion('1.0')
            .addBearerAuth()
            .addTag('auth', 'Authentication endpoints')
            .addTag('users', 'User management')
            .addTag('products', 'Product catalog')
            .addTag('stores', 'Store management')
            .addTag('orders', 'Order management')
            .addTag('cart', 'Shopping cart')
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
    }

    const port = process.env.PORT || 4000;
    await app.listen(port);

    console.log(`🚀 API Server running at http://localhost:${port}`);
    console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
