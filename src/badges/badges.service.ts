import { ConflictException, Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Badge } from "./badge.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationParams } from "src/common/pagination.params";
import { CreateBadgeDto } from "./dto/create-badge.dto";
import { PaginationResponse } from "src/common/pagination.response";

@Injectable()
export class BadgesService
{
    constructor(
        @InjectRepository(Badge)
        private readonly badgesRepository: Repository<Badge>
    ) {};

    public async findAll(pagination: PaginationParams): Promise<[Badge[], number]>
    {
        const query = await this.badgesRepository.createQueryBuilder('badge');

        query.skip(pagination.offset).take(pagination.limit);

        return query.getManyAndCount();
    }

    public async createBadge(createBadgeDto: CreateBadgeDto): Promise<Badge>
    {
        const existingBadge = await this.badgesRepository.findOne({where: {label: createBadgeDto.label}});

        if (existingBadge)
        {
            throw new ConflictException('The Badge for such label already exists.');
        }

        const badge = await this.badgesRepository.create(createBadgeDto);

        await this.badgesRepository.save(badge);

        return badge;
    };
}