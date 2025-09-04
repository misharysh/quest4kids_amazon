import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ZitadelIdentityGrpcService } from './zitadel-identity-grpc.service';

@Controller('identity')
export class IdentityController {
  constructor(
    private readonly zitadelIdentityGrpcService: ZitadelIdentityGrpcService,
  ) {}

  @Post('users')
  create(@Body() dto: CreateUserDto) {
    return this.zitadelIdentityGrpcService.createHumanUser(dto);
  }

  @Get('users')
  list(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    console.log('list');
    return this.zitadelIdentityGrpcService.listUsers(limit ?? 20, offset ?? 0);
  }

  @Delete('users/:id')
  remove(@Param('id') id: string) {
    return this.zitadelIdentityGrpcService.removeUser(id);
  }
}
