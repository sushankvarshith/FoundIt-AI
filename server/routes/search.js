import { Router } from 'express';
import { imageSearch, textSearch } from '../controllers/searchController.js';
import { optionalAuth } from '../middleware/auth.js';
import { handleUploadError, uploadSingle } from '../middleware/upload.js';
import { searchLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/image', searchLimiter, handleUploadError(uploadSingle), imageSearch);
router.get('/', searchLimiter, optionalAuth, textSearch);

export default router;
