import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema.js';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ default: '' })
  imageUrl: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  author: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ default: false })
  isDeleted: boolean;
}

export const PostSchema = SchemaFactory.createForClass(Post);
