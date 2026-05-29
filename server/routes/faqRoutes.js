import { Router } from 'express';
import * as ctrl from '../controllers/faqController.js';
import { auth, admin } from '../middleware/auth.js';

const router = Router();

// Public reads.
router.get('/', ctrl.list);
router.get('/search', ctrl.search);

// Admin FAQ management.
router.post('/', auth, admin, ctrl.create);
router.post('/promote/:queryId', auth, admin, ctrl.promote);
router.patch('/:id', auth, admin, ctrl.update);
router.post('/:id/outdated', auth, admin, ctrl.setOutdated);
router.delete('/:id', auth, admin, ctrl.remove);

export default router;
