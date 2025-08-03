import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Req, ParseFilePipe, FileTypeValidator } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

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
}
