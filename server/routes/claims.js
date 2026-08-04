import { Router } from 'express';
import { getReceivedClaims, getSentClaims, updateClaim } from '../controllers/claimController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, updateClaimRules } from '../middleware/validate.js';

const router = Router();

router.get('/received', authenticate, getReceivedClaims);
router.get('/sent', authenticate, getSentClaims);
router.put('/:id', authenticate, updateClaimRules, validate, updateClaim);

export default router;
