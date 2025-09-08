import { Global, Module } from '@nestjs/common';
import { createManagementClient } from '@zitadel/node/dist/api/clients';
import { ManagementServiceClient } from '@zitadel/node/dist/api/generated/zitadel/management';
import { createAccessTokenInterceptor } from '@zitadel/node/dist/api/index.js';
export const ZITADEL_MGMT = Symbol('ZITADEL_MGMT');

@Global()
@Module({
  providers: [
    {
      provide: ZITADEL_MGMT,
      useFactory: () => {
        const host = process.env.ZITADEL_HOST;
        const token = process.env.ZITADEL_TOKEN;

        if (!host) throw new Error('ZITADEL_HOST is not set');
        if (!token) throw new Error('ZITADEL_TOKEN is not set');

        const managementService: ManagementServiceClient =
          createManagementClient(host, createAccessTokenInterceptor(token));

        return managementService;
      },
    },
  ],
  exports: [ZITADEL_MGMT],
})
export class ZitadelConnectModule {}
