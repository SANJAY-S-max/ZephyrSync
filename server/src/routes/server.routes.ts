import { Router } from 'express';
import { ServerController } from '../controllers/server.controller';
import { requireAuth, requireAdmin, requireLocalIp } from '../middleware/auth.middleware';

const router = Router();
const serverController = new ServerController();

// Anyone can read current settings (used by UI to know if they can upload)
router.get('/settings', serverController.getSettings);

// Critical Security Rule 21 & 22: Must be Admin AND Local IP
router.patch('/settings', requireAuth, requireAdmin, requireLocalIp, serverController.updateSettings);

export default router;
