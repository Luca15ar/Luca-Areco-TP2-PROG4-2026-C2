import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @IsString({ message: 'El título debe ser un texto' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  title: string;

  @IsOptional()
  @IsString({ message: 'El mensaje debe ser un texto' })
  message?: string;

  @IsOptional()
  @IsString({ message: 'El contenido debe ser un texto' })
  content?: string;

  @IsNotEmpty({ message: 'El identificador del autor es obligatorio' })
  @IsString({ message: 'El identificador del autor debe ser una cadena válida' })
  author: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
