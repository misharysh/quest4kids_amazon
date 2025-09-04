import { Module } from '@nestjs/common';
import { ZitadelConnectModule } from './zitadel-connect.module';
import { IdentityController } from './identity.controller';
import { ZitadelIdentityGrpcService } from './zitadel-identity-grpc.service';

@Module({
  imports: [ZitadelConnectModule],
  controllers: [IdentityController],
  providers: [ZitadelIdentityGrpcService],
  exports: [ZitadelIdentityGrpcService],
})
export class IdentityModule {}
