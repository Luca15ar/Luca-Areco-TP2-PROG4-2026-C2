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

  describe('comentarios', () => {
    it('debe agregar un comentario a una publicación', async () => {
      vi.spyOn(mockUsersService, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(validAuthorId),
        firstName: 'Luca',
        lastName: 'Areco',
        username: 'lucaa',
        avatarUrl: '',
        isActive: true,
      } as any);

      const mockPost = {
        _id: new Types.ObjectId(validPostId),
        comments: [],
        save: vi.fn().mockResolvedValue(true),
      };

      mockPostModel.findOne.mockResolvedValue(mockPost);

      const res = await postsService.addComment(
        validPostId,
        validAuthorId,
        'Excelente relato, muy inspirador',
      );

      expect(res).toBeDefined();
      expect(res.message).toBe('Excelente relato, muy inspirador');
      expect(res.author.username).toBe('lucaa');
      expect(res.isEdited).toBe(false);
      expect(mockPost.comments.length).toBe(1);
    });

    it('debe rechazar un comentario con menos de 2 caracteres', async () => {
      await expect(
        postsService.addComment(validPostId, validAuthorId, 'a'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe obtener comentarios ordenados y paginados', async () => {
      const comment1 = {
        _id: new Types.ObjectId(),
        message: 'Primer comentario',
        createdAt: new Date('2026-11-01T10:00:00Z'),
        author: { username: 'user1' },
      };
      const comment2 = {
        _id: new Types.ObjectId(),
        message: 'Segundo comentario (más reciente)',
        createdAt: new Date('2026-11-02T10:00:00Z'),
        author: { username: 'user2' },
      };

      const mockPost = {
        _id: new Types.ObjectId(validPostId),
        comments: [comment1, comment2],
        populate: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(validPostId),
          comments: [comment1, comment2],
        }),
      };

      mockPostModel.findOne.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(mockPost),
      });

      const res = await postsService.getComments(validPostId, {
        limit: '5',
        offset: '0',
      });

      expect(res.total).toBe(2);
      expect(res.comments[0].message).toBe('Segundo comentario (más reciente)');
      expect(res.hasMore).toBe(false);
    });

    it('debe permitir editar el comentario al autor del mismo', async () => {
      const commentId = new Types.ObjectId().toString();
      const mockComment = {
        _id: new Types.ObjectId(commentId),
        author: new Types.ObjectId(validAuthorId),
        message: 'Mensaje original',
        isEdited: false,
      };

      const mockPost = {
        _id: new Types.ObjectId(validPostId),
        comments: [mockComment],
        save: vi.fn().mockResolvedValue(true),
      };

      mockPostModel.findOne
        .mockResolvedValueOnce(mockPost)
        .mockReturnValueOnce({
          populate: vi.fn().mockReturnThis(),
          exec: vi.fn().mockResolvedValue({
            _id: new Types.ObjectId(validPostId),
            comments: [
              {
                ...mockComment,
                message: 'Mensaje editado con éxito',
                isEdited: true,
                author: { username: 'lucaa' },
              },
            ],
          }),
        });

      const res = await postsService.updateComment(
        validPostId,
        commentId,
        validAuthorId,
        'Mensaje editado con éxito',
      );

      expect(res.message).toBe('Mensaje editado con éxito');
      expect(res.isEdited).toBe(true);
    });

    it('debe prohibir editar el comentario si el usuario no es el autor', async () => {
      const otherUserId = new Types.ObjectId().toString();
      const commentId = new Types.ObjectId().toString();
      const mockComment = {
        _id: new Types.ObjectId(commentId),
        author: new Types.ObjectId(validAuthorId),
        message: 'Mensaje original',
        isEdited: false,
      };

      const mockPost = {
        _id: new Types.ObjectId(validPostId),
        comments: [mockComment],
      };

      mockPostModel.findOne.mockResolvedValue(mockPost);

      await expect(
        postsService.updateComment(
          validPostId,
          commentId,
          otherUserId,
          'Intento de edición',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
