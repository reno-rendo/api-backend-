import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Get('product/:productId')
    @ApiOperation({ summary: 'Get product reviews' })
    async getProductReviews(
        @Param('productId') productId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.reviewsService.getProductReviews(+productId, page, limit);
    }

    @Post('product/:productId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create product review' })
    async createReview(
        @Request() req,
        @Param('productId') productId: string,
        @Body() data: any,
    ) {
        return this.reviewsService.createReview(req.user.sub, +productId, data);
    }
}
