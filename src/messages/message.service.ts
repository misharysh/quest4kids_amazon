import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Message } from "./message.entity";
import { NotificationGateway } from "../notifications/notification.gateway";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        private noficationGateway: NotificationGateway,
    ) {};

    public async sendMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
        const message = this.messageRepository.create({senderId, receiverId, content});
        const savedMessage = await this.messageRepository.save(message);
        this.noficationGateway.sendChatMessage(receiverId, savedMessage);

        return savedMessage;
    };

    public async getMessages(userId1: string, userId2: string): Promise<Message[]> {
        return this.messageRepository.find({
            where: [
                {senderId: userId1, receiverId: userId2},
                {senderId: userId2, receiverId: userId1},
            ],
            order: {createdAt: 'ASC'}
        });
    };
}