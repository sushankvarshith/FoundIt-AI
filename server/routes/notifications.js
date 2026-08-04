import { Router } from 'express';
import { getNotifications, getUnreadCount, markAsRead, markAllRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.put('/read-all', authenticate, markAllRead);
router.put('/:id/read', authenticate, markAsRead);

export default router;
