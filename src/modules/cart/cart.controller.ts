import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    @ApiOperation({ summary: 'Get cart items' })
    async getCart(@Request() req) {
        return this.cartService.getCart(req.user.sub);
    }

    @Post()
    @ApiOperation({ summary: 'Add item to cart' })
    async addToCart(@Request() req, @Body() data: any) {
        return this.cartService.addToCart(req.user.sub, data);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update cart item quantity' })
    async updateCartItem(
        @Request() req,
        @Param('id') id: string,
        @Body('quantity') quantity: number,
    ) {
        return this.cartService.updateCartItem(+id, req.user.sub, quantity);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remove item from cart' })
    async removeCartItem(@Request() req, @Param('id') id: string) {
        return this.cartService.removeCartItem(+id, req.user.sub);
    }

    @Delete()
    @ApiOperation({ summary: 'Clear cart' })
    async clearCart(@Request() req) {
        return this.cartService.clearCart(req.user.sub);
    }
}
