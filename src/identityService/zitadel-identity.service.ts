import { Injectable, InternalServerErrorException } from "@nestjs/common";
import axios from "axios";
import { IdentityUser, IIdentityService } from "./Identity.service";
import { User } from "src/users/user.entity";


@Injectable()
export class ZitadelIdentityService implements IIdentityService{
    private apiUrl = process.env.ZITADEL_BASE_URL!;
    private clientId = process.env.ZITADEL_CLIENT_ID!;
    private clientSecret = process.env.ZITADEL_CLIENT_SECRET!;

    private async getToken() {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('scope', 'urn:zitadel:iam:org:project:client:users.write');

        const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        const res = await axios.post(`${this.apiUrl}/oauth/v2/token`, params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
        },
        });

        return res.data.access_token;
    }

    async createUser(user: IdentityUser) {
        const token = await this.getToken();

        try {
        const res = await axios.post(
            `${this.apiUrl}/api/users/humans`,
            {
            email: user.email,
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            initialPassword: user.initialPassword,
            },
            {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            },
        );

        return res.data;
        } catch (err) {
            console.error('Zitadel createUser error:', err.response?.data || err.message);
            throw new InternalServerErrorException('Failed to create user in ZITADEL');
        }
    }

    async updateUser(user: IdentityUser) {
        throw new Error("Method not implemented.");
    }

    async deleteUser(userId: string) {
        const token = await this.getToken();
        try {
            await axios.delete(`${this.apiUrl}/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            console.error('Zitadel deleteUser error:', err.response?.data || err.message);
        }
    }
}