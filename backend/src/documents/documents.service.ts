import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Express } from 'express';
import { createWorker } from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class DocumentsService {
  private genAI: GoogleGenerativeAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in the .env file');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }


  private async performOcr(filePath: string): Promise<string | null> {
    try {
      const worker = await createWorker('por');
      const { data: { text } } = await worker.recognize(filePath);
      await worker.terminate();
      return text;
    } catch (error) {
      console.error('OCR Error:', error.message);
      return null;
    }
  }

  async create(userId: string, file: Express.Multer.File) {
    const document = await this.prisma.document.create({
      data: {
        fileName: file.originalname,
        storageUrl: file.path,
        status: 'PROCESSING',
        userId: userId,
      },
    });

    this.performOcr(file.path).then(async (text) => {
      if (text !== null) {
        await this.prisma.document.update({
          where: { id: document.id },
          data: { extractedText: text, status: 'COMPLETED' },
        });
        console.log(`Document ${document.id} processed successfully.`);
      } else {
        await this.prisma.document.update({
          where: { id: document.id },
          data: { status: 'FAILED' },
        });
        console.error(`OCR failed for document ${document.id}.`);
      }
    });

    return {
      message: 'Document upload received. Processing has started in the background.',
      documentId: document.id,
    };
  }

  async query(userId: string, documentId: string, prompt: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }
    if (document.userId !== userId) {
      throw new ForbiddenException('Access to this document is denied');
    }
    if (document.status !== 'COMPLETED' || !document.extractedText) {
      throw new InternalServerErrorException('Document text is not available or still processing.');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const fullPrompt = `Com base no seguinte texto extraído de um documento, responda à pergunta do usuário de forma concisa.\n\n--- INÍCIO DO TEXTO DO DOCUMENTO ---\n${document.extractedText}\n--- FIM DO TEXTO DO DOCUMENTO ---\n\n--- PERGUNTA DO USUÁRIO ---\n${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const llmResponse = result.response.text();

    await this.prisma.llmInteraction.create({
      data: {
        documentId: documentId,
        prompt: prompt,
        response: llmResponse,
      },
    });

    return { response: llmResponse };
  }

  async findAll(userId: string) {
    return this.prisma.document.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }
}
