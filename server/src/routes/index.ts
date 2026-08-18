import { Router } from 'express';
import authRoutes from './auth.routes';
import fileRoutes from './file.routes';
// import folderRoutes from './folder.routes'; // Folders are optional for now, sticking to root flat
import activityRoutes from './activity.routes';
import serverRoutes from './server.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/files', fileRoutes);
// router.use('/folders', folderRoutes);
router.use('/activity', activityRoutes);
router.use('/server', serverRoutes);

export default router;
