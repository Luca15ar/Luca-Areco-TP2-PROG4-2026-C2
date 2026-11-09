import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [UsersModule, CloudinaryModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
