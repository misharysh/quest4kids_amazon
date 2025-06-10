import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { PaginationParams } from '../common/pagination.params';
import { Badge } from './badge.entity';
import { PaginationResponse } from '../common/pagination.response';
import { Roles } from '../users/decorators/roles.decorator';
import { Role } from '../users/role.enum';
import { CreateBadgeDto } from './dto/create-badge.dto';

@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  public async getAll(
    @Query() pagination: PaginationParams,
  ): Promise<PaginationResponse<Badge>> {
    const [items, total] = await this.badgesService.findAll(pagination);

    return {
      data: items,
      meta: {
        total,
        offset: pagination.offset,
        limit: pagination.limit,
      },
    };
  }

  @Post()
  @Roles(Role.PARENT)
  public async create(@Body() createBadgeDto: CreateBadgeDto) {
    return await this.badgesService.createBadge(createBadgeDto);
  }
}
