import { Router } from 'express';
import { getDashboard, getUsers, toggleBan, adminDeleteItem, getReports, updateReport } from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.put('/users/:id/ban', toggleBan);
router.delete('/items/:id', adminDeleteItem);
router.get('/reports', getReports);
router.put('/reports/:id', updateReport);

export default router;
