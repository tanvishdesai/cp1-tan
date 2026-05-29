import { Router } from 'express';
import * as ctrl from '../controllers/adminController.js';
import { auth, admin } from '../middleware/auth.js';

// Governance + admin tooling (admin only).
const router = Router();
router.use(auth, admin);

router.get('/metrics', ctrl.metrics);

// User management.
router.get('/users', ctrl.listUsers);
router.post('/users/:id/ban', ctrl.banUser);
router.post('/users/:id/unban', ctrl.unbanUser);
router.post('/users/:id/badge', ctrl.issueNegativeBadge);
router.post('/users/:id/role', ctrl.setRole);

// Moderation queue.
router.get('/moderation', ctrl.listModeration);
router.post('/moderation/:id/resolve', ctrl.resolveModeration);
router.post('/moderation/:id/dismiss', ctrl.dismissModeration);

// Query amalgamation / merge.
router.get('/queries/clusters', ctrl.queryClusters);
router.post('/queries/merge', ctrl.mergeQueries);

// Audit log.
router.get('/audit', ctrl.audit);

export default router;
