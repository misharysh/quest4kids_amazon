import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user.entity';
import { PasswordService } from '../password/password.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { Role } from '../role.enum';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly passwordService: PasswordService
    ) {};

    public async register(createUserDto: CreateUserDto): Promise<User>
    {
        const existingUser = await this.userService.findOneByEmail(createUserDto.email);

        if (existingUser)
        {
            throw new ConflictException('Email already exists');
        }
        const userRole = Role.PARENT;
        const user = await this.userService.createUser(createUserDto, userRole);

        return user;
    };

    public async login(email:string, password: string): Promise<string>
    {
        const user = await this.userService.findOneByEmail(email);

        if (!user)
        {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!(await this.passwordService.verify(password, user.password)))
        {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateToken(user);
    };

    private generateToken(user: User): string 
    {
        const payload = {id: user.id, name: user.name, role: user.role};
        return this.jwtService.sign(payload);
    };
}
