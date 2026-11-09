import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PostsService } from './posts.service.js';
import { UsersService } from '../users/users.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { Types } from 'mongoose';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('PostsService', () => {
  let postsService: PostsService;
  let mockPostModel: any;
  let mockUsersService: Partial<UsersService>;
  let mockCloudinaryService: Partial<CloudinaryService>;

  const validAuthorId = new Types.ObjectId().toString();
  const validPostId = new Types.ObjectId().toString();

  beforeEach(() => {
    mockPostModel = function (this: any, dto: any) {
      Object.assign(this, dto);
      this._id = new Types.ObjectId(validPostId);
      this.save = vi.fn().mockResolvedValue({
        ...dto,
        _id: new Types.ObjectId(validPostId),
        populate: vi.fn().mockResolvedValue({
          ...dto,
          _id: new Types.ObjectId(validPostId),
        }),
      });
    };

    mockPostModel.find = vi.fn();
    mockPostModel.findOne = vi.fn();
    mockPostModel.countDocuments = vi.fn();
    mockPostModel.aggregate = vi.fn();

    mockUsersService = {
      findById: vi.fn(),
    };

    mockCloudinaryService = {
      uploadFile: vi.fn().mockResolvedValue('https://res.cloudinary.com/demo/image/upload/sample.jpg'),
    };

    postsService = new PostsService(
      mockPostModel as any,
      mockUsersService as UsersService,
      mockCloudinaryService as CloudinaryService,
    );
  });

  describe('create', () => {
    it('debe crear una publicación exitosamente', async () => {
      vi.spyOn(mockUsersService, 'findById').mockResolvedValue({
        _id: validAuthorId,
        firstName: 'Luca',
        lastName: 'Areco',
      } as any);

      const result = await postsService.create({
        title: 'Mi primera historia',
        message: 'Este es el mensaje de la publicación',
        author: validAuthorId,
      });

      expect(result).toBeDefined();
      expect(result.title).toBe('Mi primera historia');
    });

    it('debe aceptar content como cuerpo de la publicación', async () => {
      vi.spyOn(mockUsersService, 'findById').mockResolvedValue({
        _id: validAuthorId,
        firstName: 'Luca',
        lastName: 'Areco',
      } as any);

      const result = await postsService.create({
        title: 'Historia con content',
        content: 'Cuerpo usando la propiedad content',
        author: validAuthorId,
      });

      expect(result).toBeDefined();
      expect(result.message).toBe('Cuerpo usando la propiedad content');
    });

    it('debe subir la imagen a Cloudinary si se proporciona un archivo', async () => {
      vi.spyOn(mockUsersService, 'findById').mockResolvedValue({
        _id: validAuthorId,
      } as any);

      const fakeFile = {
        buffer: Buffer.from('fake'),
        originalname: 'test.jpg',
      } as Express.Multer.File;

      await postsService.create(
        {
          title: 'Con imagen',
          message: 'Publicación con imagen adjunta',
          author: validAuthorId,
        },
        fakeFile,
      );

      expect(mockCloudinaryService.uploadFile).toHaveBeenCalledWith(
        fakeFile,
        'posts',
      );
    });

    it('debe lanzar error si el autor no existe', async () => {
      vi.spyOn(mockUsersService, 'findById').mockResolvedValue(null);

      await expect(
        postsService.create({
          title: 'Error',
          message: 'Mensaje de prueba',
          author: validAuthorId,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('debe marcar la publicación con baja lógica si el usuario es el autor', async () => {
      const mockPost = {
        _id: new Types.ObjectId(validPostId),
        author: new Types.ObjectId(validAuthorId),
        isDeleted: false,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(mockUsersService, 'findById').mockResolvedValue({
        _id: validAuthorId,
        role: 'usuario',
      } as any);

      mockPostModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockPost),
      });
      // also direct mock for findOne without exec if queried directly
      mockPostModel.findOne.mockResolvedValue(mockPost);

      const res = await postsService.softDelete(validPostId, validAuthorId);
      expect(res.message).toBe('Publicación eliminada correctamente');
      expect(mockPost.isDeleted).toBe(true);
    });

    it('debe lanzar ForbiddenException si el usuario no es el autor ni administrador', async () => {
      const otherUserId = new Types.ObjectId().toString();
      const mockPost = {
        _id: new Types.ObjectId(validPostId),
        author: new Types.ObjectId(validAuthorId),
        isDeleted: false,
        save: vi.fn(),
      };

      vi.spyOn(mockUsersService, 'findById').mockResolvedValue({
        _id: otherUserId,
        role: 'usuario',
      } as any);

      mockPostModel.findOne.mockResolvedValue(mockPost);

      await expect(
        postsService.softDelete(validPostId, otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addLike y removeLike', () => {
    it('debe registrar un me gusta exitosamente', async () => {
      const mockPost = {
        _id: new Types.ObjectId(validPostId),
        likes: [],
        save: vi.fn().mockResolvedValue(true),
      };

      mockPostModel.findOne.mockResolvedValue(mockPost);

      const res = await postsService.addLike(validPostId, validAuthorId);
      expect(res.isLiked).toBe(true);
      expect(res.likesCount).toBe(1);
    });

    it('debe impedir dar dos veces me gusta al mismo usuario', async () => {
      const mockPost = {
        _id: new Types.ObjectId(validPostId),
        likes: [new Types.ObjectId(validAuthorId)],
        save: vi.fn(),
      };

      mockPostModel.findOne.mockResolvedValue(mockPost);

      await expect(
        postsService.addLike(validPostId, validAuthorId),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe retirar el me gusta si el usuario ya le había dado like', async () => {
      const mockPost = {
        _id: new Types.ObjectId(validPostId),
        likes: [new Types.ObjectId(validAuthorId)],
        save: vi.fn().mockResolvedValue(true),
      };

      mockPostModel.findOne.mockResolvedValue(mockPost);

      const res = await postsService.removeLike(validPostId, validAuthorId);
      expect(res.isLiked).toBe(false);
      expect(res.likesCount).toBe(0);
    });
  });
});
