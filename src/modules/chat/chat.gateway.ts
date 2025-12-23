import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers = new Map<string, string>(); // socketId -> userId

    constructor(private chatService: ChatService) { }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        const userId = this.connectedUsers.get(client.id);
        if (userId) {
            this.connectedUsers.delete(client.id);
            console.log(`User ${userId} disconnected`);
        }
    }

    @SubscribeMessage('join')
    async handleJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string },
    ) {
        this.connectedUsers.set(client.id, data.userId);
        client.join(`user:${data.userId}`);
        console.log(`User ${data.userId} joined`);
        return { success: true };
    }

    @SubscribeMessage('joinConversation')
    async handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        client.join(`conversation:${data.conversationId}`);
        return { success: true };
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: {
            conversationId: string;
            senderId: string;
            content: string;
            type?: string;
        },
    ) {
        try {
            const message = await this.chatService.createMessage({
                conversationId: data.conversationId,
                senderId: data.senderId,
                content: data.content,
                type: data.type,
            });

            // Broadcast to all in conversation
            this.server
                .to(`conversation:${data.conversationId}`)
                .emit('newMessage', message);

            return { success: true, message };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    @SubscribeMessage('markRead')
    async handleMarkRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string; userId: string },
    ) {
        await this.chatService.markAsRead(data.conversationId, data.userId);

        this.server
            .to(`conversation:${data.conversationId}`)
            .emit('messagesRead', { conversationId: data.conversationId, userId: data.userId });

        return { success: true };
    }

    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string; userId: string; isTyping: boolean },
    ) {
        client.to(`conversation:${data.conversationId}`).emit('userTyping', data);
    }
}
