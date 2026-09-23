import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import type { Request } from 'express';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

// Filtra o tipo do arquivo (mimetype)
export const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowed = (process.env.UPLOAD_ALLOWED_TYPES ?? '')
    .split(',')
    .map((t) => t.trim());

  if (!allowed.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        `Tipo de arquivo não permitido. Aceitos: ${allowed.join(', ')}`,
      ),
      false,
    );
  }
  callback(null, true);
};

// Configura onde e como salvar
export const multerStorage = diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, callback) => {
    // Nome único pra evitar colisão: uuid + extensão original
    const ext = extname(file.originalname);
    callback(null, `${randomUUID()}${ext}`);
  },
});