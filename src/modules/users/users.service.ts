import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema.js';
import { CreateUserAdminDto } from './dto/create-user-admin.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(userData: Partial<User>): Promise<UserDocument> {
    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ username: username.toLowerCase().trim() })
      .exec();
  }

  async findByIdentifier(identifier: string): Promise<UserDocument | null> {
    const clean = identifier.toLowerCase().trim();
    return this.userModel
      .findOne({
        $or: [{ email: clean }, { username: clean }],
      })
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async update(
    id: string,
    updateData: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: updateData }, { returnDocument: 'after' })
      .exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel
      .find()
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  async createAdminUser(
    dto: CreateUserAdminDto,
    avatarUrl: string = '',
  ): Promise<UserDocument> {
    const existingEmail = await this.findByEmail(dto.email);
    if (existingEmail) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    const existingUsername = await this.findByUsername(dto.username);
    if (existingUsername) {
      throw new BadRequestException('El nombre de usuario ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = new this.userModel({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email.toLowerCase().trim(),
      username: dto.username.toLowerCase().trim(),
      password: hashedPassword,
      birthdate: dto.birthdate,
      bio: dto.bio?.trim() || '',
      avatarUrl,
      role: dto.role || 'usuario',
      isActive: true,
    });

    return newUser.save();
  }

  async setUserActiveStatus(
    id: string,
    isActive: boolean,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('El identificador del usuario no es válido');
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { isActive } },
        { returnDocument: 'after' },
      )
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }
}
