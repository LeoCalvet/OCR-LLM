import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Req, ParseFilePipe, FileTypeValidator, Param, Body } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { QueryDto } from './dto/query.dto';

@Controller('documents')
@UseGuards(AuthGuard('jwt'))
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif)' })
        ],
      }),
    ) file: Express.Multer.File,
    @Req() req,
  ) {
    const user = req.user
    return this.documentsService.create(user.userId, file);
  }

  @Post('documents')
  queryDocument(
    @Param('id') documentId: string,
    @Body() QueryDto: QueryDto,
    @Req() req,
  ) {
    const userId = req.user.userId;
    return this.documentsService.query(userId, documentId, QueryDto.prompt)
  }
}
