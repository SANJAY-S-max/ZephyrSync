import { prisma } from '../utils/prisma';
import { FileStorageService } from './file.storage.service';
import { ActivityService } from './activity.service';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import mime from 'mime-types'; // need to install this or resolve from extension
import { env } from '../config/env';

const storageService = new FileStorageService();
const activityService = new ActivityService();

export class FileService {
  
  async initUpload(userId: string, originalName: string, size: number, totalChunks: number, folderId?: string) {
    // Validate file size
    if (size > env.MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`File size exceeds maximum limit of ${env.MAX_FILE_SIZE_MB} MB`);
    }

    const extension = path.extname(originalName).replace('.', '').toLowerCase();
    const allowed = env.ALLOWED_FILE_TYPES.split(',').map(s => s.trim().toLowerCase());
    
    if (allowed.length > 0 && !allowed.includes(extension)) {
      throw new Error(`File type .${extension} is not allowed`);
    }

    const uploadId = uuidv4();
    const storedName = `${uuidv4()}.${extension}`;
    const mimeType = originalName.split('.').pop() || 'application/octet-stream'; // basic mime fallback

    // Create DB entry in UPLOADING state
    const file = await prisma.file.create({
      data: {
        id: uploadId, // We use the file ID as uploadId
        ownerId: userId,
        folderId: folderId || null,
        originalName,
        storedName,
        relativePath: `/${storedName}`,
        mimeType,
        extension,
        size,
        status: 'UPLOADING'
      }
    });

    return { uploadId, chunkSize: env.CHUNK_SIZE_MB * 1024 * 1024 };
  }

  async saveChunk(uploadId: string, chunkIndex: number, buffer: Buffer) {
    // Basic check if upload exists
    const file = await prisma.file.findUnique({ where: { id: uploadId } });
    if (!file || file.status !== 'UPLOADING') throw new Error('Invalid upload session');

    await storageService.saveChunk(uploadId, chunkIndex, buffer);
  }

  async completeUpload(uploadId: string, totalChunks: number, ipAddress: string) {
    const file = await prisma.file.findUnique({ where: { id: uploadId } });
    if (!file || file.status !== 'UPLOADING') throw new Error('Invalid upload session');

    try {
      const { size, checksum } = await storageService.assembleFile(uploadId, totalChunks, file.storedName);
      
      const updated = await prisma.file.update({
        where: { id: uploadId },
        data: {
          size,
          checksum,
          status: 'READY'
        }
      });

      activityService.log({
        userId: file.ownerId,
        action: 'FILE_UPLOADED',
        entityType: 'FILE',
        entityId: file.id,
        fileName: file.originalName,
        ipAddress
      });

      return updated;
    } catch (err) {
      // Cleanup on failure
      await storageService.cleanupAbandonedChunks(uploadId, totalChunks);
      await prisma.file.delete({ where: { id: uploadId } }).catch(() => {});
      throw err;
    }
  }

  async getFile(fileId: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.deletedAt || file.status !== 'READY') throw new Error('File not found');
    return file;
  }

  getFilePath(storedName: string) {
    return storageService.getFilePath(storedName);
  }

  async deleteFile(fileId: string, userId: string, ipAddress: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.deletedAt) throw new Error('File not found');

    // Only owner or admin can delete (checked in controller/middleware)
    await prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: new Date() }
    });

    await storageService.deleteFile(file.storedName);

    activityService.log({
      userId,
      action: 'FILE_DELETED',
      entityType: 'FILE',
      entityId: file.id,
      fileName: file.originalName,
      ipAddress
    });
  }

  async listFiles(query: { folderId?: string, search?: string, limit?: number, page?: number }) {
    const limit = query.limit || 50;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null, status: 'READY' };
    
    if (query.folderId) where.folderId = query.folderId;
    else if (query.folderId === null) where.folderId = null;

    if (query.search) {
      where.originalName = { contains: query.search, mode: 'insensitive' };
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { owner: { select: { id: true, username: true } } }
      }),
      prisma.file.count({ where })
    ]);

    return { files, total, page, limit };
  }
}
