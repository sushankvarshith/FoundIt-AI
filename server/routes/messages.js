import { Router } from 'express';
import { sendMessage, getConversations, getConversation } from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, sendMessageRules } from '../middleware/validate.js';

const router = Router();

router.post('/', authenticate, sendMessageRules, validate, sendMessage);
router.get('/conversations', authenticate, getConversations);
router.get('/:userId', authenticate, getConversation);

export default router;
