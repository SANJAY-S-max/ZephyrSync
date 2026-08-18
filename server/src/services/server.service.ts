import { prisma } from '../utils/prisma';
import { env } from '../config/env';

// Cache settings to avoid DB query on every file transfer
let cachedSettings = {
  permissionMode: 'DOWNLOAD',
  maxFileSizeMB: env.MAX_FILE_SIZE_MB,
  chunkSizeMB: env.CHUNK_SIZE_MB
};

export class ServerService {
  async loadSettings() {
    const settings = await prisma.serverSetting.findFirst();
    if (settings) {
      cachedSettings = {
        permissionMode: settings.permissionMode,
        maxFileSizeMB: settings.maxFileSizeMB,
        chunkSizeMB: settings.chunkSizeMB
      };
    }
    return cachedSettings;
  }

  getSettings() {
    return cachedSettings;
  }

  async updateSettings(data: { permissionMode?: string }) {
    let settings = await prisma.serverSetting.findFirst();
    if (!settings) {
      settings = await prisma.serverSetting.create({ data: { permissionMode: data.permissionMode || 'DOWNLOAD' } });
    } else if (data.permissionMode) {
      settings = await prisma.serverSetting.update({
        where: { id: settings.id },
        data: { permissionMode: data.permissionMode }
      });
    }
    
    // Update cache
    cachedSettings.permissionMode = settings.permissionMode;
    return cachedSettings;
  }
}
