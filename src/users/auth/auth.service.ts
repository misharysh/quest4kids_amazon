import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user.entity';
import { PasswordService } from '../password/password.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { Role } from '../role.enum';
import { Repository } from 'typeorm';
import { RefreshToken } from '../refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginResponse } from '../dto/login.response.dto';
import { EmailService } from '../../email/email.service';
const {v4: uuidv4} = require('uuid');

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly passwordService: PasswordService,
        private readonly emailService: EmailService,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>
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

    public async login(email:string, password: string): Promise<LoginResponse>
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

        const refreshToken = await this.refreshTokenRepository.findOne({
            relations: ['user'],
            where: {
                user: {
                    id: user.id
                }
            }
        });

        return this.generateUserTokens(user, refreshToken);
    };

    public async refreshTokens(token: string): Promise<LoginResponse>
    {
        try
        {
            const refreshToken = await this.refreshTokenRepository.findOne({
                where: {token: token},
                relations: ['user']
            });

            if (!refreshToken)
            {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const user = await this.userService.findOneOrFail(refreshToken.user.id);

            const newTokens = await this.generateUserTokens(user, refreshToken);

            return newTokens;
        }
        catch(error)
        {
            throw new InternalServerErrorException('An unexpected error occurred');
        }
    };

    public async forgotPassword(email: string)
    {
        //check that user exists
        const user = await this.userService.findOneByEmail(email);

        if (user)
        {            
            const resetToken = await this.emailService.sendResetPasswordLink(email);

            user.resetToken = resetToken;
            await this.userService.saveUser(user);
        }

        return {"message": "If this user exists, they will receive an email"};
    };

    public async resetPassword(token: string, password: string): Promise<void>
    {
        const email = await this.emailService.decodeConfirmationToken(token);

        const user = await this.userService.findOneByEmail(email);

        if (!user) {
            throw new NotFoundException(`No user found for email: ${email}`);
        }

        const hashedPassword = await this.passwordService.hash(password);
        user.password = hashedPassword;
        user.resetToken = '';
        await this.userService.saveUser(user);
    };

    public async loginWithGoogle(user: User): Promise<LoginResponse>
    {
        const refreshToken = await this.refreshTokenRepository.findOne({
            relations: ['user'],
            where: {
                user: {
                    id: user.id
                }
            }
        });

        return this.generateUserTokens(user, refreshToken);
    };

    public async validateGoogleUser(profile: any)
    {
        const user = await this.userService.findOneByEmail(profile.emails[0].value);

        if (user) return user;

        //create user
        const userRole = Role.PARENT;
        const createUserDto = new CreateUserDto ();
        createUserDto.email = profile.emails[0].value;
        createUserDto.name = profile.name.givenName  
                            + profile.name.familyName ? ' ' + profile.name.familyName : '';
        createUserDto.password = '';
        
        return await this.userService.createUser(createUserDto, userRole); //register as parent
    };

    private async generateUserTokens(user: User, currentToken: RefreshToken | null): Promise<LoginResponse>
    {
        try
        {
            const payload = {id: user.id, name: user.name, role: user.role};
            const accessToken = this.jwtService.sign(payload);

            const refreshToken = uuidv4();
            await this.storeRefreshToken(refreshToken, user, currentToken);

            return {
                accessToken: accessToken,
                refreshToken: refreshToken,
            };
        }
        catch(error)
        {
            throw new InternalServerErrorException('An unexpected error occurred');
        }
    };

    private async storeRefreshToken(token: string, user: User, currentToken: RefreshToken | null)
    {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 60); // 60 days from now 

        if (currentToken)
        {
            currentToken.token = token;
            currentToken.expiryDate = expiryDate;

            await this.refreshTokenRepository.save(currentToken);
        }
        else
        {
            const newToken = await this.refreshTokenRepository.create({
                token: token,
                expiryDate: expiryDate,
                user: user
            });

            await this.refreshTokenRepository.save(newToken);
        }
    };
}
