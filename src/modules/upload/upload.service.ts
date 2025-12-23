import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
    private uploadDir = './uploads';

    constructor() {
        // Create upload directories if they don't exist
        const dirs = ['products', 'stores', 'users', 'chat'];
        dirs.forEach(dir => {
            const fullPath = path.join(this.uploadDir, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        });
    }

    async uploadFile(
        file: Express.Multer.File,
        folder: 'products' | 'stores' | 'users' | 'chat',
    ): Promise<{ url: string; filename: string }> {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        const filePath = path.join(this.uploadDir, folder, filename);

        await fs.promises.writeFile(filePath, file.buffer);

        return {
            url: `/uploads/${folder}/${filename}`,
            filename,
        };
    }

    async uploadMultiple(
        files: Express.Multer.File[],
        folder: 'products' | 'stores' | 'users' | 'chat',
    ): Promise<Array<{ url: string; filename: string }>> {
        return Promise.all(files.map(file => this.uploadFile(file, folder)));
    }

    async deleteFile(url: string): Promise<void> {
        const filePath = path.join('.', url);
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }

    getFileType(mimetype: string): 'image' | 'video' | 'document' | 'other' {
        if (mimetype.startsWith('image/')) return 'image';
        if (mimetype.startsWith('video/')) return 'video';
        if (mimetype.includes('pdf') || mimetype.includes('document')) return 'document';
        return 'other';
    }

    validateFile(
        file: Express.Multer.File,
        options?: {
            maxSize?: number; // in bytes
            allowedTypes?: string[];
        },
    ): { valid: boolean; error?: string } {
        const maxSize = options?.maxSize || 5 * 1024 * 1024; // 5MB default
        const allowedTypes = options?.allowedTypes || [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ];

        if (file.size > maxSize) {
            return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
        }

        if (!allowedTypes.includes(file.mimetype)) {
            return { valid: false, error: 'File type not allowed' };
        }

        return { valid: true };
    }
}
