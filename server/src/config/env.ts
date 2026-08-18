import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string(),
  SESSION_SECRET: z.string(),
  STORAGE_DIR: z.string().default('./storage'),
  MAX_FILE_SIZE_MB: z.string().transform(Number).default('5120'),
  CHUNK_SIZE_MB: z.string().transform(Number).default('8'),
  UPLOAD_CONCURRENCY: z.string().transform(Number).default('4'),
  ALLOWED_FILE_TYPES: z.string().default('pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif,webp,mp3,wav,mp4,mkv,zip,rar,7z,csv,json,js,ts,html,css,java,py,exe'),
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_PASSWORD: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
