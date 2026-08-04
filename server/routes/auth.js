import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, getMe, updateProfile, changePassword, updateAvatar } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { handleUploadError, uploadSingle } from '../middleware/upload.js';
import { validate, registerRules, loginRules, forgotPasswordRules, resetPasswordRules, updateProfileRules, changePasswordRules } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password/:token', resetPasswordRules, validate, resetPassword);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfileRules, validate, updateProfile);
router.put('/password', authenticate, changePasswordRules, validate, changePassword);
router.put('/avatar', authenticate, handleUploadError(uploadSingle), updateAvatar);

export default router;
