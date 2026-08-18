import { Request, Response } from 'express';
import { FileService } from '../services/file.service';
import { z } from 'zod';
import fs from 'fs';
import { ServerService } from '../services/server.service';
import { ActivityService } from '../services/activity.service';

const fileService = new FileService();
const serverService = new ServerService();
const activityService = new ActivityService();

const initUploadSchema = z.object({
  originalName: z.string(),
  size: z.number(),
  totalChunks: z.number().min(1),
  folderId: z.string().optional()
});

const completeUploadSchema = z.object({
  uploadId: z.string(),
  totalChunks: z.number()
});

export class FileController {

  initUpload = async (req: Request, res: Response) => {
    // Check global permission
    const settings = serverService.getSettings();
    if (settings.permissionMode === 'READ_ONLY' || settings.permissionMode === 'DOWNLOAD') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Uploads are currently disabled by the server administrator.' } });
    }

    const validated = initUploadSchema.safeParse(req.body);
    if (!validated.success) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' } });

    const result = await fileService.initUpload(
      req.user.id,
      validated.data.originalName,
      validated.data.size,
      validated.data.totalChunks,
      validated.data.folderId
    );

    res.json({ success: true, data: result });
  };

  uploadChunk = async (req: Request, res: Response) => {
    const { uploadId, chunkIndex } = req.body;
    
    if (!uploadId || chunkIndex === undefined || !req.file) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing chunk data' } });
    }

    await fileService.saveChunk(uploadId, Number(chunkIndex), req.file.buffer);
    res.json({ success: true });
  };

  completeUpload = async (req: Request, res: Response) => {
    const validated = completeUploadSchema.safeParse(req.body);
    if (!validated.success) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' } });

    const file = await fileService.completeUpload(validated.data.uploadId, validated.data.totalChunks, req.ip || req.socket.remoteAddress || '');
    // Need to correctly serialize BigInt inside file
    res.json({ success: true, data: { ...file, size: file.size.toString() } });
  };

  download = async (req: Request, res: Response) => {
    const settings = serverService.getSettings();
    if (settings.permissionMode === 'READ_ONLY') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Downloads are disabled.' } });
    }

    const { id } = req.params;
    const file = await fileService.getFile(id);
    const filePath = fileService.getFilePath(file.storedName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Physical file missing on server' } });
    }

    activityService.log({
      userId: req.user.id,
      action: 'FILE_DOWNLOAD_STARTED',
      entityType: 'FILE',
      entityId: file.id,
      fileName: file.originalName,
      ipAddress: req.ip || req.socket.remoteAddress || ''
    });

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Length', file.size.toString());
    res.setHeader('Accept-Ranges', 'bytes');

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  };

  list = async (req: Request, res: Response) => {
    const { folderId, search, limit, page } = req.query;
    
    const result = await fileService.listFiles({
      folderId: folderId as string,
      search: search as string,
      limit: limit ? Number(limit) : 50,
      page: page ? Number(page) : 1
    });

    // Serialize BigInt
    result.files = result.files.map(f => ({ ...f, size: f.size.toString() })) as any;

    res.json({ success: true, data: result });
  };

  delete = async (req: Request, res: Response) => {
    const settings = serverService.getSettings();
    if (settings.permissionMode !== 'UPLOAD_DOWNLOAD') {
       // Only allow deletion if UPLOAD_DOWNLOAD mode is active, or if user is admin. Wait, prompt says "unless a separate admin rule explicitly allows it".
       // Let's just allow deletion if you're the owner OR you're admin. But if READ_ONLY, even owner shouldn't delete.
       if (req.user.role !== 'ADMIN') {
         if (settings.permissionMode === 'READ_ONLY' || settings.permissionMode === 'DOWNLOAD') {
           return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'File deletion is disabled.' } });
         }
       }
    }

    const file = await fileService.getFile(req.params.id);
    if (file.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized to delete this file.' } });
    }

    await fileService.deleteFile(req.params.id, req.user.id, req.ip || req.socket.remoteAddress || '');
    res.json({ success: true });
  }
}
