import { Router } from 'express';
import { createItem, getItems, getItem, updateItem, deleteItem, updateItemStatus, getUserItems, getTrending, getRecentReturned, getItemQR } from '../controllers/itemController.js';
import { toggleLike, getLikes } from '../controllers/likeController.js';
import { createComment, getComments, deleteComment } from '../controllers/commentController.js';
import { toggleBookmark } from '../controllers/bookmarkController.js';
import { trackShare } from '../controllers/shareController.js';
import { createClaim } from '../controllers/claimController.js';
import { createReport } from '../controllers/reportController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { handleUploadError, uploadMultiple, uploadSingle } from '../middleware/upload.js';
import { validate, createItemRules, updateItemRules, createCommentRules, createClaimRules, createReportRules, uuidParam } from '../middleware/validate.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Item CRUD
router.post('/', authenticate, uploadLimiter, handleUploadError(uploadMultiple), createItemRules, validate, createItem);
router.get('/', optionalAuth, getItems);
router.get('/trending', optionalAuth, getTrending);
router.get('/recent-returned', getRecentReturned);
router.get('/user/:userId', optionalAuth, getUserItems);
router.get('/:id', optionalAuth, uuidParam(), validate, getItem);
router.put('/:id', authenticate, updateItemRules, validate, updateItem);
router.delete('/:id', authenticate, uuidParam(), validate, deleteItem);
router.put('/:id/status', authenticate, uuidParam(), validate, updateItemStatus);
router.get('/:id/qr', uuidParam(), validate, getItemQR);

// Likes
router.post('/:id/like', authenticate, uuidParam(), validate, toggleLike);
router.get('/:id/likes', optionalAuth, uuidParam(), validate, getLikes);

// Comments
router.post('/:id/comments', authenticate, createCommentRules, validate, createComment);
router.get('/:id/comments', uuidParam(), validate, getComments);

// Bookmarks
router.post('/:id/bookmark', authenticate, uuidParam(), validate, toggleBookmark);

// Shares
router.post('/:id/share', optionalAuth, uuidParam(), validate, trackShare);

// Claims
router.post('/:id/claim', authenticate, handleUploadError(uploadSingle), createClaimRules, validate, createClaim);

// Reports
router.post('/:id/report', authenticate, createReportRules, validate, createReport);

export default router;
