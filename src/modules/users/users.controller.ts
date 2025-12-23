import { Controller, Get, Put, Body, UseGuards, Request, Param, Post, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async getProfile(@Request() req) {
        const user = await this.usersService.findById(req.user.sub);
        if (!user) {
            return null;
        }
        const { password, ...result } = user as any;
        return result;
    }

    @Put('me')
    @ApiOperation({ summary: 'Update current user profile' })
    async updateProfile(@Request() req, @Body() updateData: any) {
        return this.usersService.updateProfile(req.user.sub, updateData);
    }

    // Address endpoints
    @Get('me/addresses')
    @ApiOperation({ summary: 'Get user addresses' })
    async getAddresses(@Request() req) {
        return this.usersService.getAddresses(req.user.sub);
    }

    @Post('me/addresses')
    @ApiOperation({ summary: 'Create new address' })
    async createAddress(@Request() req, @Body() addressData: any) {
        return this.usersService.createAddress(req.user.sub, addressData);
    }

    @Put('me/addresses/:id')
    @ApiOperation({ summary: 'Update address' })
    async updateAddress(
        @Request() req,
        @Param('id') id: string,
        @Body() addressData: any,
    ) {
        return this.usersService.updateAddress(+id, req.user.sub, addressData);
    }

    @Delete('me/addresses/:id')
    @ApiOperation({ summary: 'Delete address' })
    async deleteAddress(@Param('id') id: string) {
        return this.usersService.deleteAddress(+id);
    }
}
