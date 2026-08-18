import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export async function seedInitialData() {
  // Seed Server Settings
  let settings = await prisma.serverSetting.findFirst();
  if (!settings) {
    settings = await prisma.serverSetting.create({
      data: {
        permissionMode: 'DOWNLOAD',
        maxFileSizeMB: env.MAX_FILE_SIZE_MB,
        chunkSizeMB: env.CHUNK_SIZE_MB
      }
    });
    console.log('✅ Default server settings created');
  }

  // Seed Admin User
  let admin = await prisma.user.findUnique({ where: { username: env.ADMIN_USERNAME } });
  
  if (!admin && (await prisma.user.count()) === 0) {
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
    admin = await prisma.user.create({
      data: {
        username: env.ADMIN_USERNAME,
        passwordHash,
        role: 'ADMIN',
        displayName: 'Administrator'
      }
    });
    console.log(`✅ Default admin created: ${env.ADMIN_USERNAME}`);
  }
}
