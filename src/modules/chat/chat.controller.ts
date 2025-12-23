import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private chatService: ChatService) { }

    @Get('conversations')
    async getConversations(@Req() req: any) {
        return this.chatService.getConversations(req.user.sub);
    }

    @Get('conversations/:id/messages')
    async getMessages(@Param('id') id: string, @Req() req: any) {
        return this.chatService.getMessages(id, req.user.sub);
    }

    @Post('conversations')
    async createConversation(
        @Body() data: { sellerId: string; productId?: string },
        @Req() req: any,
    ) {
        return this.chatService.createConversation(
            req.user.sub,
            data.sellerId,
            data.productId,
        );
    }

    @Post('conversations/:id/read')
    async markAsRead(@Param('id') id: string, @Req() req: any) {
        await this.chatService.markAsRead(id, req.user.sub);
        return { success: true };
    }
}
