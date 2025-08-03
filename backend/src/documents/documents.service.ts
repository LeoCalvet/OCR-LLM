import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Express } from 'express';
import { createWorker } from 'tesseract.js';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import * as fs from 'fs';

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
        mimeType: file.mimetype,
        status: 'PROCESSING',
        userId: userId,
      },
    });

    this.performOcr(file.path).then(async (text) => {
      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          extractedText: text,
          status: text ? 'COMPLETED' : 'FAILED',
        },
      });
    });

    return {
      message: 'Document upload received. Processing has started.',
      documentId: document.id,
    };
  }

  async query(userId: string, documentId: string, prompt: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) throw new NotFoundException('Document not found');
    if (document.userId !== userId) throw new ForbiddenException('Access to this document is denied');
    if (document.status !== 'COMPLETED') {
      throw new InternalServerErrorException('Document is still processing or failed.');
    }

    const imageBuffer = fs.readFileSync(document.storageUrl);
    const imagePart: Part = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: document.mimeType,
      },
    };

    const textContext = `Aqui está o texto extraído via OCR do documento: "${document.extractedText || 'Nenhum texto extraído.'}"`;

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent([prompt, imagePart, textContext]);
    const responseText = result.response.text();

    await this.prisma.llmInteraction.create({
      data: {
        documentId: documentId,
        prompt: prompt,
        response: responseText,
      },
    });

    return { response: responseText };
  }

  async findAll(userId: string) {
    return this.prisma.document.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        userId: userId,
      },
      include: {
        llmInteractions: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found or access denied');
    }
    return document;
  }

  async generateDownloadableFile(userId: string, documentId: string): Promise<{ content: string; fileName: string }> {
    const document = await this.findOne(userId, documentId);

    let fileContent = `--- TEXTO EXTRAÍDO DO DOCUMENTO ---\n\n`;
    fileContent += document.extractedText || 'Nenhum texto foi extraído.\n';
    fileContent += `\n\n--- HISTÓRICO DE INTERAÇÕES COM A IA ---\n\n`;

    if (document.llmInteractions.length > 0) {
      document.llmInteractions.forEach((interaction, index) => {
        fileContent += `Interação #${index + 1}:\n`;
        fileContent += `[PERGUNTA]: ${interaction.prompt}\n`;
        fileContent += `[RESPOSTA]: ${interaction.response}\n\n`;
      });
    } else {
      fileContent += 'Nenhuma interação registrada.\n';
    }

    const originalFileName = document.fileName.split('.').slice(0, -1).join('.') || document.fileName;
    const downloadFileName = `${originalFileName}_analise.txt`;

    return { content: fileContent, fileName: downloadFileName };
  }
}
