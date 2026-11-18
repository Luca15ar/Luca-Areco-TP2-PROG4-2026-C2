import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { PostsService } from './posts.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { QueryPostsDto } from './dto/query-posts.dto.js';
import { LikePostDto } from './dto/like-post.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { QueryCommentsDto } from './dto/query-comments.dto.js';
import { multerImageOptions } from '../auth/multer.config.js';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image', multerImageOptions))
  async create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.postsService.create(createPostDto, file);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() queryDto: QueryPostsDto) {
    return this.postsService.findAll(queryDto);
  }

  @Get('user/:authorId')
  @HttpCode(HttpStatus.OK)
  async findByUser(@Param('authorId') authorId: string) {
    return this.postsService.findLatestByAuthor(authorId, 3);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async softDelete(
    @Param('id') id: string,
    @Query('userId') queryUserId?: string,
    @Body('userId') bodyUserId?: string,
  ) {
    const userId = queryUserId || bodyUserId;
    if (!userId) {
      throw new BadRequestException(
        'El identificador del usuario que realiza la baja es obligatorio',
      );
    }
    return this.postsService.softDelete(id, userId);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async addLike(@Param('id') id: string, @Body() likePostDto: LikePostDto) {
    return this.postsService.addLike(id, likePostDto.userId);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  async removeLike(
    @Param('id') id: string,
    @Query('userId') queryUserId?: string,
    @Body('userId') bodyUserId?: string,
  ) {
    const userId = queryUserId || bodyUserId;
    if (!userId) {
      throw new BadRequestException(
        'El identificador del usuario es obligatorio para retirar el me gusta',
      );
    }
    return this.postsService.removeLike(id, userId);
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @Headers('authorization') authHeader?: string,
  ) {
    let authorId = createCommentDto.author;
    if (!authorId && authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      try {
        const payload = this.jwtService.decode(token) as any;
        authorId = payload?.sub;
      } catch {}
    }
    if (!authorId) {
      throw new BadRequestException('El identificador del autor es obligatorio');
    }
    return this.postsService.addComment(id, authorId, createCommentDto.message);
  }

  @Get(':id/comments')
  @HttpCode(HttpStatus.OK)
  async getComments(
    @Param('id') id: string,
    @Query() queryDto: QueryCommentsDto,
  ) {
    return this.postsService.getComments(id, queryDto);
  }

  @Put(':id/comments/:commentId')
  @HttpCode(HttpStatus.OK)
  async updateComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Headers('authorization') authHeader?: string,
  ) {
    let userId = updateCommentDto.userId;
    if (!userId && authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      try {
        const payload = this.jwtService.decode(token) as any;
        userId = payload?.sub;
      } catch {}
    }
    if (!userId) {
      throw new BadRequestException('El identificador del usuario es obligatorio');
    }
    return this.postsService.updateComment(
      id,
      commentId,
      userId,
      updateCommentDto.message,
    );
  }
}
