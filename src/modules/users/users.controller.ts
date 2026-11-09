import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Types } from 'mongoose';
import { UsersService } from './users.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { multerAvatarOptions } from '../auth/multer.config.js';
import { User } from './schemas/user.schema.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('El identificador del usuario no es válido');
    }

    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      birthdate: user.birthdate,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isActive: user.isActive,
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar', multerAvatarOptions))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('El identificador del usuario no es válido');
    }

    const existingUser = await this.usersService.findById(id);
    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (
      updateUserDto.username &&
      updateUserDto.username.toLowerCase().trim() !==
        existingUser.username.toLowerCase()
    ) {
      const userWithUsername = await this.usersService.findByUsername(
        updateUserDto.username,
      );
      if (userWithUsername && userWithUsername._id.toString() !== id) {
        throw new BadRequestException('El nombre de usuario ya está en uso');
      }
    }

    let avatarUrl = existingUser.avatarUrl;
    if (file) {
      avatarUrl = await this.cloudinaryService.uploadFile(file, 'avatars');
    }

    const updatePayload: Partial<User> = {};
    if (updateUserDto.firstName !== undefined) {
      updatePayload.firstName = updateUserDto.firstName.trim();
    }
    if (updateUserDto.lastName !== undefined) {
      updatePayload.lastName = updateUserDto.lastName.trim();
    }
    if (updateUserDto.username !== undefined) {
      updatePayload.username = updateUserDto.username.toLowerCase().trim();
    }
    if (updateUserDto.birthdate !== undefined) {
      updatePayload.birthdate = updateUserDto.birthdate;
    }
    if (updateUserDto.bio !== undefined) {
      updatePayload.bio = updateUserDto.bio.trim();
    }
    if (avatarUrl !== existingUser.avatarUrl) {
      updatePayload.avatarUrl = avatarUrl;
    }

    const updatedUser = await this.usersService.update(id, updatePayload);
    if (!updatedUser) {
      throw new NotFoundException('No se pudo actualizar el usuario');
    }

    return {
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      username: updatedUser.username,
      email: updatedUser.email,
      birthdate: updatedUser.birthdate,
      bio: updatedUser.bio,
      avatarUrl: updatedUser.avatarUrl,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: (updatedUser as any).createdAt,
      updatedAt: (updatedUser as any).updatedAt,
    };
  }
}
