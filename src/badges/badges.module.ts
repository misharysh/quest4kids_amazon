import { Module } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { BadgesController } from './badges.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge } from './badge.entity';
import { UserBadge } from './user-badge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, UserBadge])],
  controllers: [BadgesController],
  providers: [BadgesService],
})
export class BadgesModule {}
