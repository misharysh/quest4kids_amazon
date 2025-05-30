import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
    imports: [
      ClientsModule.registerAsync([
        {
          name: 'COMMUNICATION',
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            transport: Transport.TCP,
            options: {
              host: configService.get<string>('MICRO_HOST', '127.0.0.1'),
              port: configService.get<number>('MICRO_PORT', 4001),
            },
          }),
        },
      ]),
    ],
    exports: [ClientsModule]
})
export class CommunicationClientModule {}