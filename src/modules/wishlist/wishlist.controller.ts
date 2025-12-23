import { Controller, Get, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) { }

    @Get()
    @ApiOperation({ summary: 'Get wishlist' })
    async getWishlist(@Request() req) {
        return this.wishlistService.getWishlist(req.user.sub);
    }

    @Post(':productId')
    @ApiOperation({ summary: 'Add product to wishlist' })
    async addToWishlist(@Request() req, @Param('productId') productId: string) {
        return this.wishlistService.addToWishlist(req.user.sub, +productId);
    }

    @Delete(':productId')
    @ApiOperation({ summary: 'Remove product from wishlist' })
    async removeFromWishlist(@Request() req, @Param('productId') productId: string) {
        return this.wishlistService.removeFromWishlist(req.user.sub, +productId);
    }

    @Get(':productId/check')
    @ApiOperation({ summary: 'Check if product is in wishlist' })
    async isInWishlist(@Request() req, @Param('productId') productId: string) {
        const inWishlist = await this.wishlistService.isInWishlist(req.user.sub, +productId);
        return { inWishlist };
    }
}
