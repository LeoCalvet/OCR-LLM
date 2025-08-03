import { IsNotEmpty, IsString } from 'class-validator';

export class QueryDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
