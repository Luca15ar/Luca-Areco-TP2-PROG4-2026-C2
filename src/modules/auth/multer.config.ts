import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const multerAvatarOptions = {
  storage: diskStorage({
    destination: (req, file, callback) => {
      const uploadPath = './uploads/avatars';
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      callback(null, uploadPath);
    },
    filename: (req, file, callback) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname);
      callback(null, `avatar-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/i)) {
      return callback(
        new BadRequestException(
          'Solo se permiten archivos de imagen (jpg, jpeg, png, webp, gif)',
        ),
        false,
      );
    }
    callback(null, true);
  },
};
