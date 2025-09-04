import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ZITADEL_MGMT } from './zitadel-connect.module';
import {
  AddHumanUserResponse,
  ListUsersResponse,
  ManagementServiceClient,
  RemoveUserResponse,
} from '@zitadel/node/dist/api/generated/zitadel/management';

@Injectable()
export class ZitadelIdentityGrpcService {
  constructor(
    @Inject(ZITADEL_MGMT) private readonly mgmt: ManagementServiceClient,
  ) {}

  async createHumanUser(input: {
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    initialPassword: string;
  }) {
    try {
      const addHumanUserResponse: AddHumanUserResponse =
        await this.mgmt.addHumanUser({
          userName: input.userName,
          profile: { firstName: input.firstName, lastName: input.lastName },
          email: { email: input.email, isEmailVerified: false },
          initialPassword: input.initialPassword,
        });

      return addHumanUserResponse;
    } catch (e: any) {
      console.error('ZITADEL addHumanUser failed:', e?.message ?? e);
      throw new InternalServerErrorException('Zitadel create user failed');
    }
  }

  async listUsers(limit = 20, offset = 0) {
    try {
      const listUsersResponse: ListUsersResponse = await this.mgmt.listUsers({
        query: {
          limit,
          offset: offset,
        },
      });

      return listUsersResponse;
    } catch (e: any) {
      console.error('ZITADEL listUsers failed:', e?.message ?? e);
      throw new InternalServerErrorException('Zitadel list users failed');
    }
  }

  async removeUser(userId: string) {
    try {
      const removeUserResponse: RemoveUserResponse = await this.mgmt.removeUser(
        { id: userId },
      );

      return removeUserResponse;
    } catch (e: any) {
      console.error('ZITADEL removeUser failed:', e?.message ?? e);
      throw new InternalServerErrorException('Zitadel remove user failed');
    }
  }
}
