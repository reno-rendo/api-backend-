import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StoresService } from './stores.service';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
    constructor(private readonly storesService: StoresService) { }

    @Get(':slug')
    @ApiOperation({ summary: 'Get store by slug' })
    async findBySlug(@Param('slug') slug: string) {
        return this.storesService.findBySlug(slug);
    }

    @Get(':slug/products')
    @ApiOperation({ summary: 'Get store products' })
    async getProducts(
        @Param('slug') slug: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        const store = await this.storesService.findBySlug(slug);
        return this.storesService.getStoreProducts(store.id, page, limit);
    }
}
