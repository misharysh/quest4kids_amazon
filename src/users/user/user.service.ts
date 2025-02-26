import { Injectable } from '@nestjs/common';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordService } from '../password/password.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { Role } from '../role.enum';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly passwordService: PasswordService
    ) {};

    public async findOneByEmail (email: string): Promise<User | null>
    {
        return await this.userRepository.findOneBy({email});
    };

    public async createUser(createUserDto: CreateUserDto, role: Role): Promise<User>
    {
        const hashedPassword = await this.passwordService.hash(createUserDto.password);

        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
            role: role
        });

        return await this.userRepository.save(user);
    };

    public async findOne(id: string): Promise<User | null>
    {
        return await this.userRepository.findOneBy({id});
    };
}
