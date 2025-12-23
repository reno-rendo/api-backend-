import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get()
    @ApiOperation({ summary: 'Get user orders' })
    async getOrders(@Request() req, @Query('status') status?: string) {
        return this.ordersService.getUserOrders(req.user.sub, status);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get order by ID' })
    async getOrder(@Request() req, @Param('id') id: string) {
        return this.ordersService.getOrderById(+id, req.user.sub);
    }

    @Post()
    @ApiOperation({ summary: 'Create new order' })
    async createOrder(@Request() req, @Body() data: any) {
        return this.ordersService.createOrder(req.user.sub, data);
    }
}
