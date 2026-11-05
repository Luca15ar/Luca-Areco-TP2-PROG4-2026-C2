import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication, ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module.js';

let cachedServer: Express | null = null;

function getUploadsDir(): string {
  if (process.env.VERCEL) {
    return join(tmpdir(), 'uploads');
  }
  const backendUploads = join(process.cwd(), 'backend', 'uploads');
  if (existsSync(join(process.cwd(), 'backend'))) {
    return backendUploads;
  }
  return join(process.cwd(), 'uploads');
}

export async function bootstrapServer(): Promise<Express> {
  if (cachedServer) {
    return cachedServer;
  }

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, adapter);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const uploadsDir = getUploadsDir();
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  await app.init();
  cachedServer = expressApp;
  return cachedServer;
}

export default async function handler(req: Request, res: Response) {
  try {
    const server = await bootstrapServer();
    return server(req, res);
  } catch (err: any) {
    console.error('[Vercel Handler Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({
        statusCode: 500,
        error: 'Error de inicialización del servidor',
        message: err?.message || String(err),
        mongoUriConfigured: Boolean(process.env.MONGODB_URI),
      });
    }
  }
}

if (!process.env.VERCEL) {
  bootstrapServer()
    .then((server) => {
      const port = process.env.PORT ?? 3000;
      server.listen(port, () => {
        console.log(`[NestJS] Servidor local escuchando en http://localhost:${port}`);
      });
    })
    .catch((err) => {
      console.error('[NestJS] Error al iniciar el servidor local:', err);
    });
}
