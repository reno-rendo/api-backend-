import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Email atau password salah');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Email atau password salah');
        }

        const { password: _, ...result } = user;
        return result;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.fullName,
                avatar: user.avatar,
                role: user.role,
                isVerified: user.isVerified,
            },
            accessToken: this.jwtService.sign(payload),
        };
    }

    async register(registerDto: RegisterDto) {
        // Check if email already exists
        const existingEmail = await this.usersService.findByEmail(registerDto.email);
        if (existingEmail) {
            throw new ConflictException('Email sudah terdaftar');
        }

        // Check if username already exists
        if (registerDto.username) {
            const existingUsername = await this.usersService.findByUsername(registerDto.username);
            if (existingUsername) {
                throw new ConflictException('Username sudah digunakan');
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        // Create user
        const user = await this.usersService.create({
            ...registerDto,
            password: hashedPassword,
        });

        // Generate token
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
            },
            accessToken: this.jwtService.sign(payload),
        };
    }

    async getProfile(userId: number) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User tidak ditemukan');
        }

        const { password: _, ...result } = user;
        return result;
    }
}
