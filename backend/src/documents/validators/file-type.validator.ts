import { FileValidator } from '@nestjs/common';

export class CustomFileTypeValidator extends FileValidator<{ allowedMimeTypes: string[] }> {
  constructor(options: { allowedMimeTypes: string[] }) {
    super(options);
  }

  isValid(file?: Express.Multer.File): boolean | Promise<boolean> {
    if (!file) {
      return false;
    }
    const allowedMimeTypes = this.validationOptions.allowedMimeTypes;
    return allowedMimeTypes.includes(file.mimetype);
  }

  buildErrorMessage(file?: Express.Multer.File): string {
    const mimetype = file?.mimetype ?? 'unknown';
    return `Validation failed. Invalid file type: ${mimetype}. Allowed types are: ${this.validationOptions.allowedMimeTypes.join(', ')}`;
  }
}
