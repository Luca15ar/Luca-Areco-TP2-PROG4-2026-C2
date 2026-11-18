import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
    private readonly jwtService: JwtService,
  ) {}

  async generateToken(user: {
    _id: any;
    email: string;
    username: string;
    role: string;
  }): Promise<string> {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }

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

      const token = await this.generateToken(newUser);
      return {
        user: this.sanitizeUser(newUser),
        token,
      };
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

      const isMatch = await bcrypt.compare(loginDto.password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      if (!user.isActive) {
        throw new UnauthorizedException(
          'Tu cuenta ha sido deshabilitada por un administrador.',
        );
      }

      const token = await this.generateToken(user);
      return {
        user: this.sanitizeUser(user),
        token,
      };
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

  async authorize(token?: string) {
    if (!token) {
      throw new UnauthorizedException('Token no provisto');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }
      if (!user.isActive) {
        throw new UnauthorizedException(
          'Tu cuenta ha sido deshabilitada por un administrador.',
        );
      }
      return this.sanitizeUser(user);
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async refreshToken(
    token?: string,
    userId?: string,
  ): Promise<{ token: string }> {
    if (!token && !userId) {
      throw new UnauthorizedException('Token no provisto');
    }
    try {
      let targetUserId = userId;
      if (token) {
        const payload = await this.jwtService.verifyAsync(token, {
          ignoreExpiration: true,
        });
        targetUserId = payload.sub;
      }

      if (!targetUserId) {
        throw new UnauthorizedException('Identificador de usuario no válido');
      }

      const user = await this.usersService.findById(targetUserId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Usuario no válido o deshabilitado');
      }
      const newToken = await this.generateToken(user);
      return { token: newToken };
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }

  private sanitizeUser(user: UserDocument) {
    const userObj = user.toObject();
    delete (userObj as any).password;
    delete (userObj as any).__v;
    return userObj;
  }
}
