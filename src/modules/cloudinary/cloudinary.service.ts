import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  isConfigured(): boolean {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: 'avatars' | 'posts',
  ): Promise<string> {
    if (this.isConfigured()) {
      try {
        const result = await this.uploadToCloudinary(file, `trama/${folder}`);
        this.logger.log(`Imagen subida exitosamente a Cloudinary: ${result.secure_url}`);
        return result.secure_url;
      } catch (error) {
        this.logger.error(
          'Error al subir imagen a Cloudinary, recurriendo a almacenamiento local',
          error,
        );
      }
    }

    return this.saveToLocalDisk(file, folder);
  }

  private uploadToCloudinary(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          if (!result) {
            return reject(new Error('No se recibió respuesta de Cloudinary'));
          }
          resolve(result);
        },
      );

      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }

  private saveToLocalDisk(
    file: Express.Multer.File,
    folder: 'avatars' | 'posts',
  ): string {
    const uploadDir = join(process.cwd(), 'uploads', folder);
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    const ext = file.originalname.split('.').pop() || 'jpg';
    const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    const filePath = join(uploadDir, filename);
    writeFileSync(filePath, file.buffer);
    return `/uploads/${folder}/${filename}`;
  }
}
