import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.category.findMany({
            include: {
                children: true,
                _count: { select: { products: true } },
            },
            where: { parentId: null }, // Only root categories
            orderBy: { name: 'asc' },
        });
    }

    async findBySlug(slug: string) {
        return this.prisma.category.findUnique({
            where: { slug },
            include: {
                children: true,
                parent: true,
            },
        });
    }
}
