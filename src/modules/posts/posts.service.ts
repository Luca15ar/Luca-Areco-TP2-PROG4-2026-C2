import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema.js';
import { UsersService } from '../users/users.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { QueryPostsDto } from './dto/query-posts.dto.js';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createPostDto: CreatePostDto,
    file?: Express.Multer.File,
  ): Promise<PostDocument> {
    if (!Types.ObjectId.isValid(createPostDto.author)) {
      throw new BadRequestException('El identificador del autor no es válido');
    }

    const body = (createPostDto.content || createPostDto.message || '').trim();
    if (!body || body.length < 5) {
      throw new BadRequestException(
        'El contenido de la publicación debe tener al menos 5 caracteres',
      );
    }

    const author = await this.usersService.findById(createPostDto.author);
    if (!author) {
      throw new NotFoundException('El usuario autor no existe');
    }

    let imageUrl = createPostDto.imageUrl?.trim() || '';
    if (file) {
      imageUrl = await this.cloudinaryService.uploadFile(file, 'posts');
    }

    const newPost = new this.postModel({
      title: createPostDto.title.trim(),
      message: body,
      content: body,
      imageUrl,
      author: new Types.ObjectId(createPostDto.author),
      likes: [],
      comments: [],
      isDeleted: false,
    });

    const saved = await newPost.save();
    return saved.populate('author', 'firstName lastName username avatarUrl role');
  }

  async findAll(queryDto: QueryPostsDto): Promise<{
    posts: PostDocument[];
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  }> {
    const limit = queryDto.limit && queryDto.limit > 0 ? Number(queryDto.limit) : 10;
    let offset = queryDto.offset && queryDto.offset >= 0 ? Number(queryDto.offset) : 0;
    if (
      queryDto.page &&
      queryDto.page > 0 &&
      (queryDto.offset === undefined || queryDto.offset === null)
    ) {
      offset = (Number(queryDto.page) - 1) * limit;
    }

    const filter: Record<string, any> = { isDeleted: false };

    if (queryDto.authorId) {
      if (!Types.ObjectId.isValid(queryDto.authorId)) {
        throw new BadRequestException('El identificador del autor no es válido');
      }
      filter.author = new Types.ObjectId(queryDto.authorId);
    }

    const total = await this.postModel.countDocuments(filter).exec();
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit) || 1;

    if (queryDto.sort === 'likes') {
      const pipeline: any[] = [
        { $match: filter },
        {
          $addFields: {
            likesCount: { $size: { $ifNull: ['$likes', []] } },
          },
        },
        { $sort: { likesCount: -1, createdAt: -1 } },
        { $skip: offset },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
            pipeline: [
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  username: 1,
                  avatarUrl: 1,
                  role: 1,
                },
              },
            ],
          },
        },
        { $unwind: '$author' },
      ];

      const posts = await this.postModel.aggregate(pipeline).exec();
      return { posts, total, limit, offset, page: currentPage, totalPages };
    }

    const posts = await this.postModel
      .find(filter)
      .populate('author', 'firstName lastName username avatarUrl role')
      .populate('comments.author', 'firstName lastName username avatarUrl')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();

    return { posts, total, limit, offset, page: currentPage, totalPages };
  }

  async findLatestByAuthor(
    authorId: string,
    limit = 3,
  ): Promise<PostDocument[]> {
    if (!Types.ObjectId.isValid(authorId)) {
      throw new BadRequestException('El identificador del autor no es válido');
    }
    return this.postModel
      .find({ author: new Types.ObjectId(authorId), isDeleted: false })
      .populate('author', 'firstName lastName username avatarUrl role')
      .populate('comments.author', 'firstName lastName username avatarUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findById(id: string): Promise<PostDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('El identificador de la publicación no es válido');
    }

    const post = await this.postModel
      .findOne({ _id: new Types.ObjectId(id), isDeleted: false })
      .populate('author', 'firstName lastName username avatarUrl role')
      .populate('comments.author', 'firstName lastName username avatarUrl')
      .exec();

    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return post;
  }

  async softDelete(
    id: string,
    userId: string,
  ): Promise<{ message: string; id: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('El identificador de la publicación no es válido');
    }
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('El identificador del usuario no es válido');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no válido para esta operación');
    }

    const post = await this.postModel.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const isAuthor = post.author.toString() === userId;
    const isAdmin = user.role === 'administrador';

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException(
        'Solo el autor o un administrador pueden eliminar esta publicación',
      );
    }

    post.isDeleted = true;
    await post.save();

    return {
      message: 'Publicación eliminada correctamente',
      id,
    };
  }

  async addLike(
    id: string,
    userId: string,
  ): Promise<{ message: string; likesCount: number; isLiked: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('El identificador de la publicación no es válido');
    }
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('El identificador del usuario no es válido');
    }

    const post = await this.postModel.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const alreadyLiked = post.likes.some(
      (likeId) =>
        likeId.toString() === userId ||
        (likeId as any)._id?.toString() === userId,
    );
    if (alreadyLiked) {
      throw new BadRequestException('Ya has indicado que te gusta esta publicación');
    }

    post.likes.push(new Types.ObjectId(userId));
    await post.save();

    return {
      message: 'Me gusta registrado con éxito',
      likesCount: post.likes.length,
      isLiked: true,
    };
  }

  async removeLike(
    id: string,
    userId: string,
  ): Promise<{ message: string; likesCount: number; isLiked: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('El identificador de la publicación no es válido');
    }
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('El identificador del usuario no es válido');
    }

    const post = await this.postModel.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const alreadyLiked = post.likes.some(
      (likeId) =>
        likeId.toString() === userId ||
        (likeId as any)._id?.toString() === userId,
    );
    if (!alreadyLiked) {
      throw new BadRequestException('No habías indicado que te gusta esta publicación');
    }

    post.likes = post.likes.filter(
      (likeId) =>
        likeId.toString() !== userId &&
        (likeId as any)._id?.toString() !== userId,
    );
    await post.save();

    return {
      message: 'Me gusta eliminado con éxito',
      likesCount: post.likes.length,
      isLiked: false,
    };
  }
}
