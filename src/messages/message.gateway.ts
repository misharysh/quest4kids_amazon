import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket  } from 'socket.io';
import { MessageService } from "./message.service";
import { OnlineService } from "src/users/online/online.service";


@WebSocketGateway({ cors: { origin: '*' } })
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {

    constructor(
        private readonly messageService: MessageService,
        private readonly onlineService: OnlineService
    ) {

    }
    
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId)
        {
            client.join(`user-${userId}`);
            this.onlineService.addUser(userId);
        }
    };

    handleDisconnect(client: any) {
        const userId = client.handshake.query.userId as string;
        if (userId)
        {
            this.onlineService.deleteUser(userId);
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