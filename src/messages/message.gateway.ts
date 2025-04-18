import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket  } from 'socket.io';
import { MessageService } from "./message.service";


@WebSocketGateway({ cors: { origin: '*' } })
export class MessageGateway implements OnGatewayConnection {

    constructor(
        private readonly messageService: MessageService
    ) {

    };

    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId)
        {
            client.join(`user-${userId}`);
        }
    };

    @SubscribeMessage('send-chat-message')
    async handleChatMessage(
        @MessageBody() body: {receiverId: string, content: string},
        @ConnectedSocket() client: Socket
    ) {
        const senderId = client.handshake.query.userId as string;
        const message = await this.messageService.sendMessage(senderId, body.receiverId, body.content);

        return message;
    };
}