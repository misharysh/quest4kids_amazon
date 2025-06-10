import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { Message } from "../messages/message.entity";
import { Notification } from "./notification.entity";

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId)
        {
            client.join(`user-${userId}`);
        }
    };

    handleDisconnect(client: any) {
        
    };

    sendNotification(userId: string, notification: Notification)
    {
        this.server.to(`user-${userId}`).emit('notification', {
            message: notification.message,
            createdAt: notification.createdAt,
            id: notification.id,
            isRead: notification.isRead,
            userId: notification.userId,
            username: notification.user.name,
            timeStamp: new Date(),
        });
    };

    sendChatMessage(userId: string, message: Message)
    {
        this.server.to(`user-${userId}`).emit('chat-message', {
            from: message.senderId,
            content: message.content,
            timeStamp: message.createdAt,
        });
    };
}