import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RegisterDto } from '../auth/dto/auth.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(data: RegisterDto & { password: string }) {
        return this.prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                fullName: data.fullName,
                username: data.username,
                phone: data.phone,
            },
        });
    }

    async findById(id: number) {
        return this.prisma.user.findUnique({
            where: { id },
            include: {
                addresses: true,
                store: true,
            },
        });
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findByUsername(username: string) {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }

    async updateProfile(id: number, data: Partial<{
        fullName: string;
        username: string;
        phone: string;
        avatar: string;
        province: string;
        city: string;
        district: string;
    }>) {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async updatePassword(id: number, hashedPassword: string) {
        return this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
    }

    // Address management
    async getAddresses(userId: number) {
        return this.prisma.userAddress.findMany({
            where: { userId },
            orderBy: { isDefault: 'desc' },
        });
    }

    async createAddress(userId: number, data: {
        label: string;
        recipientName: string;
        phone: string;
        province: string;
        city: string;
        district: string;
        provinceId: string;
        cityId: string;
        districtId: string;
        fullAddress: string;
        postalCode?: string;
        isDefault?: boolean;
    }) {
        // If setting as default, unset other defaults
        if (data.isDefault) {
            await this.prisma.userAddress.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }

        return this.prisma.userAddress.create({
            data: {
                userId,
                ...data,
            },
        });
    }

    async updateAddress(id: number, userId: number, data: Partial<{
        label: string;
        recipientName: string;
        phone: string;
        province: string;
        city: string;
        district: string;
        fullAddress: string;
        postalCode: string;
        isDefault: boolean;
    }>) {
        // If setting as default, unset other defaults
        if (data.isDefault) {
            await this.prisma.userAddress.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }

        return this.prisma.userAddress.update({
            where: { id },
            data,
        });
    }

    async deleteAddress(id: number) {
        return this.prisma.userAddress.delete({
            where: { id },
        });
    }
}
