import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  firstName: string;

  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  lastName: string;

  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos',
  })
  username: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe poseer al menos 8 caracteres' })
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message:
      'La contraseña debe contener al menos 1 letra mayúscula y 1 número',
  })
  password: string;

  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @IsString({ message: 'La fecha de nacimiento debe ser una cadena de texto' })
  birthdate: string;

  @IsOptional()
  @IsString({ message: 'La descripción breve debe ser una cadena de texto' })
  bio?: string;
}
