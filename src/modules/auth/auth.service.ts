import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UserDocument } from '../users/schemas/user.schema.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async register(registerDto: RegisterDto, file?: Express.Multer.File) {
    try {
      const existingEmail = await this.usersService.findByEmail(
        registerDto.email,
      );
      if (existingEmail) {
        throw new BadRequestException('El correo electrónico ya está registrado');
      }

      const existingUsername = await this.usersService.findByUsername(
        registerDto.username,
      );
      if (existingUsername) {
        throw new BadRequestException('El nombre de usuario ya está en uso');
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      let avatarUrl = '';
      if (file) {
        avatarUrl = await this.cloudinaryService.uploadFile(file, 'avatars');
      }

      const newUser = await this.usersService.create({
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        email: registerDto.email,
        username: registerDto.username,
        password: hashedPassword,
        birthdate: registerDto.birthdate,
        bio: registerDto.bio || '',
        avatarUrl,
        role: 'usuario',
        isActive: true,
      });

      return this.sanitizeUser(newUser);
    } catch (err: any) {
      if (
        err instanceof BadRequestException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      console.error('[AuthService.register] Error al crear cuenta:', err);
      throw new InternalServerErrorException(
        `Error al crear la cuenta: ${err?.message || err}`,
      );
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.usersService.findByIdentifier(loginDto.identifier);
      if (!user) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      if (!user.isActive) {
        throw new UnauthorizedException(
          'La cuenta de usuario se encuentra deshabilitada',
        );
      }

      const isMatch = await bcrypt.compare(loginDto.password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      return this.sanitizeUser(user);
    } catch (err: any) {
      if (
        err instanceof BadRequestException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      console.error('[AuthService.login] Error al iniciar sesión:', err);
      throw new InternalServerErrorException(
        `Error al iniciar sesión: ${err?.message || err}`,
      );
    }
  }

  private sanitizeUser(user: UserDocument) {
    const userObj = user.toObject();
    delete (userObj as any).password;
    delete (userObj as any).__v;
    return userObj;
  }
}
