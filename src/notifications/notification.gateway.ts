import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { Message } from "src/messages/message.entity";

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

    sendNotification(userId: string, message: string)
    {
        this.server.to(`user-${userId}`).emit('notification', {
            message,
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