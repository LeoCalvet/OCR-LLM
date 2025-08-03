import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Express } from "express";
import { createWorker } from "tesseract.js";

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) { }

  private async performOcr(filePath: string): Promise<string> {
    try {
      const worker = await createWorker('por');
      const ret = await worker.recognize(filePath);
      await worker.terminate();
      return ret.data.text;
    } catch (error) {
      console.error('OCR error:', error);
      throw new InternalServerErrorException('Failed to process document with OCR.');
    }
  }

  async create(userId: string, file: Express.Multer.File) {
    const document = await this.prisma.document.create({
      data: {
        fileName: file.originalname,
        storageUrl: file.path,
        status: 'PROCESSING',
        userId: userId
      }
    })

    this.performOcr(file.path).then(async (extractedText) => {
      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          extractedText: extractedText,
          status: 'COMPLETED',
        },
      });
      console.log(`Document ${document.id} processed successfully.`);
    }).catch(async (error) => {
      await this.prisma.document.update({
        where: { id: document.id },
        data: { status: 'FAILED' },
      });
      console.error(`Failed to process document ${document.id}.`, error);
    });

    return {
      message: 'Document upload received. Processing has started in the background.',
      documentId: document.id,
    };
  }
}
