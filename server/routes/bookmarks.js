import { Router } from 'express';
import { getBookmarks } from '../controllers/bookmarkController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getBookmarks);

export default router;
