import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { PostsModule } from './modules/posts/posts.module.js';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/TP2';
const maskedUri = mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
console.log('[Mongoose] Configurando conexión a:', maskedUri);

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    }),
    UsersModule,
    AuthModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
