import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'El usuario o correo es obligatorio' })
  @IsString({ message: 'El identificador debe ser una cadena de texto' })
  identifier: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  password: string;
}
