import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

export const multerImageOptions = {
  storage: memoryStorage(),
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

export const multerAvatarOptions = multerImageOptions;
