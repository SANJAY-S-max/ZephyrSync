import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { requireAuth } from '../middleware/auth.middleware';
import multer from 'multer';

const router = Router();
const fileController = new FileController();

// Use memory storage for chunk upload to avoid double disk writes
// The chunks will be saved via FileStorageService in the controller
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth); // All file routes require authentication

router.post('/upload/init', fileController.initUpload);
router.post('/upload/chunk', upload.single('chunk'), fileController.uploadChunk);
router.post('/upload/complete', fileController.completeUpload);
router.get('/:id/download', fileController.download);
router.delete('/:id', fileController.delete);
router.get('/', fileController.list);

export default router;
