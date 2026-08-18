import { Request, Response } from 'express';
import { ServerService } from '../services/server.service';
import { z } from 'zod';
import { ActivityService } from '../services/activity.service';

const serverService = new ServerService();
const activityService = new ActivityService();

const settingsSchema = z.object({
  permissionMode: z.enum(['READ_ONLY', 'DOWNLOAD', 'UPLOAD_DOWNLOAD'])
});

export class ServerController {
  
  getSettings = async (req: Request, res: Response) => {
    // Only return settings, UI decides whether to render it editable based on local admin check
    const settings = serverService.getSettings();
    res.json({ success: true, data: settings });
  };

  updateSettings = async (req: Request, res: Response) => {
    const validated = settingsSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid settings' } });
    }

    const newSettings = await serverService.updateSettings(validated.data);
    
    activityService.log({
      userId: req.user.id,
      action: 'SETTINGS_CHANGED',
      entityType: 'SERVER',
      metadata: { permissionMode: newSettings.permissionMode },
      ipAddress: req.ip || req.socket.remoteAddress || ''
    });

    res.json({ success: true, data: newSettings });
  };
}
