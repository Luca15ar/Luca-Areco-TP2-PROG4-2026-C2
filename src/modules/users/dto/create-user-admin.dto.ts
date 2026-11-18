import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserAdminDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(25, { message: 'El nombre no puede superar los 25 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, {
    message: 'El nombre solo puede contener letras',
  })
  firstName: string;

  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @MaxLength(25, { message: 'El apellido no puede superar los 25 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, {
    message: 'El apellido solo puede contener letras',
  })
  lastName: string;

  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre de usuario debe poseer al menos 3 caracteres' })
  @MaxLength(15, { message: 'El nombre de usuario no puede superar los 15 caracteres' })
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

  @IsOptional()
  @IsIn(['usuario', 'administrador'], {
    message: 'El rol debe ser usuario o administrador',
  })
  role?: string;
}
