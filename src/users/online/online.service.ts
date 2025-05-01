import { Injectable } from "@nestjs/common";

@Injectable()
export class OnlineService {
    private onlineUsers = new Set<string>();

    addUser(userId:string)
    {
        this.onlineUsers.add(userId);
    };

    deleteUser(userId: string)
    {
        this.onlineUsers.delete(userId);
    };

    isUserOnline(userId: string): boolean
    {
        return this.onlineUsers.has(userId);
    };

    getOnlineUser(): string[]
    {
        return Array.from(this.onlineUsers);
    };
}