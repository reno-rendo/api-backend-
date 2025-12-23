import {
    Controller,
    Post,
    Delete,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
    constructor(private uploadService: UploadService) { }

    @Post('product')
    @UseInterceptors(FilesInterceptor('files', 10))
    async uploadProductImages(@UploadedFiles() files: Express.Multer.File[]) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded');
        }

        // Validate all files
        for (const file of files) {
            const validation = this.uploadService.validateFile(file, {
                maxSize: 5 * 1024 * 1024,
                allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
            });
            if (!validation.valid) {
                throw new BadRequestException(validation.error);
            }
        }

        const results = await this.uploadService.uploadMultiple(files, 'products');
        return { success: true, files: results };
    }

    @Post('store')
    @UseInterceptors(FileInterceptor('file'))
    async uploadStoreLogo(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const validation = this.uploadService.validateFile(file);
        if (!validation.valid) {
            throw new BadRequestException(validation.error);
        }

        const result = await this.uploadService.uploadFile(file, 'stores');
        return { success: true, ...result };
    }

    @Post('user')
    @UseInterceptors(FileInterceptor('file'))
    async uploadUserAvatar(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const validation = this.uploadService.validateFile(file);
        if (!validation.valid) {
            throw new BadRequestException(validation.error);
        }

        const result = await this.uploadService.uploadFile(file, 'users');
        return { success: true, ...result };
    }

    @Post('chat')
    @UseInterceptors(FileInterceptor('file'))
    async uploadChatFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const validation = this.uploadService.validateFile(file, {
            maxSize: 10 * 1024 * 1024,
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
        });
        if (!validation.valid) {
            throw new BadRequestException(validation.error);
        }

        const result = await this.uploadService.uploadFile(file, 'chat');
        const fileType = this.uploadService.getFileType(file.mimetype);
        return { success: true, ...result, type: fileType };
    }

    @Delete()
    async deleteFile(@Body() body: { url: string }) {
        await this.uploadService.deleteFile(body.url);
        return { success: true };
    }
}
