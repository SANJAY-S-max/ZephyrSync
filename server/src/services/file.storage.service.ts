import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { env } from '../config/env';

export class FileStorageService {
  private chunksDir: string;
  private filesDir: string;

  constructor() {
    this.chunksDir = path.resolve(env.STORAGE_DIR, 'chunks');
    this.filesDir = path.resolve(env.STORAGE_DIR, 'files');

    // Ensure directories exist
    if (!fs.existsSync(this.chunksDir)) fs.mkdirSync(this.chunksDir, { recursive: true });
    if (!fs.existsSync(this.filesDir)) fs.mkdirSync(this.filesDir, { recursive: true });
  }

  async saveChunk(uploadId: string, chunkIndex: number, buffer: Buffer) {
    // Validate path against traversal
    const chunkPath = path.join(this.chunksDir, `${uploadId}-${chunkIndex}`);
    if (!chunkPath.startsWith(this.chunksDir)) throw new Error('Path traversal detected');
    
    await fs.promises.writeFile(chunkPath, buffer);
  }

  async assembleFile(uploadId: string, totalChunks: number, storedName: string): Promise<{ size: number, checksum: string }> {
    const finalPath = path.join(this.filesDir, storedName);
    if (!finalPath.startsWith(this.filesDir)) throw new Error('Path traversal detected');

    const writeStream = fs.createWriteStream(finalPath);
    const hash = crypto.createHash('sha256');

    let totalSize = 0;

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(this.chunksDir, `${uploadId}-${i}`);
        if (!fs.existsSync(chunkPath)) {
          throw new Error(`Missing chunk ${i}`);
        }

        const buffer = await fs.promises.readFile(chunkPath);
        totalSize += buffer.length;
        writeStream.write(buffer);
        hash.update(buffer);

        // Delete chunk immediately after it's appended
        await fs.promises.unlink(chunkPath).catch(() => {});
      }

      return new Promise((resolve, reject) => {
        writeStream.on('error', reject);
        writeStream.end(() => {
          resolve({ size: totalSize, checksum: hash.digest('hex') });
        });
      });
    } catch (err) {
      writeStream.end();
      if (fs.existsSync(finalPath)) {
        await fs.promises.unlink(finalPath).catch(() => {});
      }
      throw err;
    }
  }

  getFilePath(storedName: string) {
    const fullPath = path.join(this.filesDir, storedName);
    if (!fullPath.startsWith(this.filesDir)) throw new Error('Path traversal detected');
    return fullPath;
  }

  async deleteFile(storedName: string) {
    const fullPath = this.getFilePath(storedName);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  async cleanupAbandonedChunks(uploadId: string, totalChunks: number) {
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(this.chunksDir, `${uploadId}-${i}`);
      if (fs.existsSync(chunkPath)) {
        await fs.promises.unlink(chunkPath).catch(() => {});
      }
    }
  }
}
