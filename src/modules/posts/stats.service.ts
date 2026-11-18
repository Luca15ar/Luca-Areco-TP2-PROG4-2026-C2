import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema.js';
import { StatsQueryDto } from './dto/stats-query.dto.js';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
  ) {}

  private parseDateRange(startDate?: string, endDate?: string) {
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      const parsedStart = new Date(startDate);
      if (!isNaN(parsedStart.getTime())) {
        start = parsedStart;
      }
    }

    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (!isNaN(parsedEnd.getTime())) {
        if (endDate.length === 10) {
          parsedEnd.setUTCHours(23, 59, 59, 999);
        }
        end = parsedEnd;
      }
    }

    return { start, end };
  }

  async getPostsByUser(query: StatsQueryDto): Promise<{
    totalPosts: number;
    users: { userId: string; username: string; name: string; count: number }[];
  }> {
    const { start, end } = this.parseDateRange(query.startDate, query.endDate);

    const matchStage: Record<string, any> = { isDeleted: false };
    if (start || end) {
      matchStage.createdAt = {};
      if (start) matchStage.createdAt.$gte = start;
      if (end) matchStage.createdAt.$lte = end;
    }

    const results = await this.postModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$author',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'author',
        },
      },
      { $unwind: '$author' },
      {
        $project: {
          _id: 0,
          userId: { $toString: '$_id' },
          username: '$author.username',
          name: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ['$author.firstName', ''] },
                  ' ',
                  { $ifNull: ['$author.lastName', ''] },
                ],
              },
            },
          },
          count: 1,
        },
      },
      { $sort: { count: -1, name: 1 } },
    ]);

    const totalPosts = results.reduce((acc, curr) => acc + curr.count, 0);

    return {
      totalPosts,
      users: results,
    };
  }

  async getCommentsTimeline(query: StatsQueryDto): Promise<{
    totalComments: number;
    timeline: { date: string; count: number }[];
  }> {
    const { start, end } = this.parseDateRange(query.startDate, query.endDate);

    const matchCommentDate: Record<string, any> = {};
    if (start || end) {
      matchCommentDate['comments.createdAt'] = {};
      if (start) matchCommentDate['comments.createdAt'].$gte = start;
      if (end) matchCommentDate['comments.createdAt'].$lte = end;
    }

    const pipeline: any[] = [
      { $match: { isDeleted: false, 'comments.0': { $exists: true } } },
      { $unwind: '$comments' },
    ];

    if (Object.keys(matchCommentDate).length > 0) {
      pipeline.push({ $match: matchCommentDate });
    }

    pipeline.push(
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$comments.createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
      { $sort: { date: 1 } },
    );

    const timeline = await this.postModel.aggregate(pipeline);
    const totalComments = timeline.reduce((acc, curr) => acc + curr.count, 0);

    return {
      totalComments,
      timeline,
    };
  }

  async getCommentsByPost(query: StatsQueryDto): Promise<{
    totalComments: number;
    posts: { postId: string; title: string; count: number }[];
  }> {
    const { start, end } = this.parseDateRange(query.startDate, query.endDate);

    const matchCommentDate: Record<string, any> = {};
    if (start || end) {
      matchCommentDate['comments.createdAt'] = {};
      if (start) matchCommentDate['comments.createdAt'].$gte = start;
      if (end) matchCommentDate['comments.createdAt'].$lte = end;
    }

    const pipeline: any[] = [
      { $match: { isDeleted: false, 'comments.0': { $exists: true } } },
      { $unwind: '$comments' },
    ];

    if (Object.keys(matchCommentDate).length > 0) {
      pipeline.push({ $match: matchCommentDate });
    }

    pipeline.push(
      {
        $group: {
          _id: '$_id',
          title: { $first: '$title' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          postId: { $toString: '$_id' },
          title: 1,
          count: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    );

    const posts = await this.postModel.aggregate(pipeline);
    const totalComments = posts.reduce((acc, curr) => acc + curr.count, 0);

    return {
      totalComments,
      posts,
    };
  }
}
