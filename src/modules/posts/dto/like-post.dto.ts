import { IsNotEmpty, IsString } from 'class-validator';

export class LikePostDto {
  @IsNotEmpty({ message: 'El identificador del usuario es obligatorio' })
  @IsString({ message: 'El identificador del usuario debe ser un texto' })
  userId: string;
}
