import { UserRole } from './user.model';

export interface PostAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl?: string;
  role?: UserRole;
}

export interface PostComment {
  _id?: string;
  author: PostAuthor;
  message: string;
  isEdited?: boolean;
  createdAt: string;
}

export interface Post {
  _id: string;
  title: string;
  message: string;
  content?: string;
  imageUrl?: string;
  author: PostAuthor;
  likes: string[];
  comments: PostComment[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PostsResponse {
  posts: Post[];
  total: number;
  limit: number;
  offset: number;
  page?: number;
  totalPages?: number;
}
