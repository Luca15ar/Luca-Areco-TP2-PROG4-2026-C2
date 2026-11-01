import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema.js';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private readonly postModel: Model<PostDocument>) {}

  async findAll(): Promise<PostDocument[]> {
    return this.postModel
      .find({ isDeleted: false })
      .populate('author', 'firstName lastName username avatarUrl')
      .sort({ createdAt: -1 })
      .exec();
  }
}
