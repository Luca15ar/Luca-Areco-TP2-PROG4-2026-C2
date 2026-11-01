export type UserRole = 'usuario' | 'administrador';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  birthdate: string;
  bio?: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

