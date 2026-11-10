import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

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
    if (!this.isConfigured()) {
      this.logger.error('Credenciales de Cloudinary no configuradas en el entorno');
      throw new InternalServerErrorException(
        'El servicio de almacenamiento de imágenes en la nube no está configurado',
      );
    }

    try {
      const result = await this.uploadToCloudinary(file, `trama/${folder}`);
      this.logger.log(
        `Imagen subida exitosamente a Cloudinary: ${result.secure_url}`,
      );
      return result.secure_url;
    } catch (error: any) {
      this.logger.error(
        `Error al subir imagen a Cloudinary: ${error?.message || error}`,
      );
      throw new InternalServerErrorException(
        'Ocurrió un error al subir la imagen al servidor en la nube',
      );
    }
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
}
