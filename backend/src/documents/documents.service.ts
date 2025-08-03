import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, file: Express.Multer.File) {
    console.log('Document received:', file);

    const document = await this.prisma.document.create({
      data: {
        fileName: file.originalname,
        storageUrl: `/path/to/files/${file.filename}`, // Placeholder
        userId: userId,
      },
    });

    return {
      message: 'Document uploaded successfully, processing started',
      document: document,
    };
  }
}
