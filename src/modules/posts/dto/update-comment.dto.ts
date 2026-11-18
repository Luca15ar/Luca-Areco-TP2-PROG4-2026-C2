import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @IsNotEmpty({ message: 'El mensaje del comentario es obligatorio' })
  @IsString({ message: 'El mensaje debe ser un texto' })
  @MinLength(2, { message: 'El comentario debe tener al menos 2 caracteres' })
  message: string;

  @IsOptional()
  @IsString({ message: 'El identificador del usuario debe ser una cadena válida' })
  userId?: string;
}
