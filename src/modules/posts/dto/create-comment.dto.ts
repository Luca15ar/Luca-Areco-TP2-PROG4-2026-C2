import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'El mensaje del comentario es obligatorio' })
  @IsString({ message: 'El mensaje debe ser un texto' })
  @MinLength(2, { message: 'El comentario debe tener al menos 2 caracteres' })
  message: string;

  @IsOptional()
  @IsString({ message: 'El identificador del autor debe ser una cadena válida' })
  author?: string;
}
