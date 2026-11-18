import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { multerAvatarOptions } from './multer.config.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('avatar', multerAvatarOptions))
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.authService.register(registerDto, file);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('authorize')
  @HttpCode(HttpStatus.OK)
  async authorize(
    @Headers('authorization') authHeader?: string,
    @Body('token') bodyToken?: string,
  ) {
    const token = this.extractToken(authHeader, bodyToken);
    return this.authService.authorize(token);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Headers('authorization') authHeader?: string,
    @Body('token') bodyToken?: string,
    @Body('userId') bodyUserId?: string,
  ) {
    const token = this.extractToken(authHeader, bodyToken);
    return this.authService.refreshToken(token, bodyUserId);
  }

  private extractToken(
    authHeader?: string,
    bodyToken?: string,
  ): string | undefined {
    if (authHeader && typeof authHeader === 'string') {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        return parts[1].trim();
      }
      if (authHeader.trim()) {
        return authHeader.trim();
      }
    }
    return bodyToken?.trim();
  }
}
