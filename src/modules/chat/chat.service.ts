import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async getConversations(userId: string) {
        // Get all conversations for a user
        return this.prisma.conversation.findMany({
            where: {
                OR: [
                    { buyerId: userId },
                    { sellerId: userId },
                ],
            },
            include: {
                buyer: { select: { id: true, name: true } },
                seller: { select: { id: true, name: true } },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async getMessages(conversationId: string, userId: string) {
        // Verify user is part of conversation
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [
                    { buyerId: userId },
                    { sellerId: userId },
                ],
            },
        });

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        return this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, name: true } },
            },
        });
    }

    async createMessage(data: {
        conversationId: string;
        senderId: string;
        content: string;
        type?: string;
    }) {
        const message = await this.prisma.message.create({
            data: {
                conversationId: data.conversationId,
                senderId: data.senderId,
                content: data.content,
                messageType: data.type || 'TEXT',
            },
            include: {
                sender: { select: { id: true, name: true } },
            },
        });

        // Update conversation timestamp
        await this.prisma.conversation.update({
            where: { id: data.conversationId },
            data: { updatedAt: new Date() },
        });

        return message;
    }

    async createConversation(buyerId: string, sellerId: string, productId?: string) {
        // Check if conversation already exists
        const existing = await this.prisma.conversation.findFirst({
            where: {
                buyerId,
                sellerId,
                productId: productId || undefined,
            },
        });

        if (existing) return existing;

        return this.prisma.conversation.create({
            data: {
                buyerId,
                sellerId,
                productId,
            },
        });
    }

    async markAsRead(conversationId: string, userId: string) {
        await this.prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                isRead: false,
            },
            data: { isRead: true },
        });
    }
}
