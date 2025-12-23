import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all products with filtering' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'categoryId', required: false, type: Number })
    @ApiQuery({ name: 'brandId', required: false, type: Number })
    @ApiQuery({ name: 'minPrice', required: false, type: Number })
    @ApiQuery({ name: 'maxPrice', required: false, type: Number })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['newest', 'price_asc', 'price_desc', 'popular', 'rating'] })
    async findAll(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
        @Query('categoryId') categoryId?: number,
        @Query('brandId') brandId?: number,
        @Query('minPrice') minPrice?: number,
        @Query('maxPrice') maxPrice?: number,
        @Query('sortBy') sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating',
    ) {
        return this.productsService.findAll({
            page,
            limit,
            search,
            categoryId,
            brandId,
            minPrice,
            maxPrice,
            sortBy,
        });
    }

    @Get('flash-sale')
    @ApiOperation({ summary: 'Get flash sale products' })
    async getFlashSale(@Query('limit') limit?: number) {
        return this.productsService.getFlashSaleProducts(limit);
    }

    @Get('featured')
    @ApiOperation({ summary: 'Get featured/popular products' })
    async getFeatured(@Query('limit') limit?: number) {
        return this.productsService.getFeaturedProducts(limit);
    }

    @Get('new-arrivals')
    @ApiOperation({ summary: 'Get newest products' })
    async getNewArrivals(@Query('limit') limit?: number) {
        return this.productsService.getNewArrivals(limit);
    }

    @Get(':slug')
    @ApiOperation({ summary: 'Get product by slug' })
    async findBySlug(@Param('slug') slug: string) {
        return this.productsService.findBySlug(slug);
    }
}
