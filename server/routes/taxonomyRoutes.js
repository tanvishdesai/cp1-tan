import { Router } from 'express';
import * as ctrl from '../controllers/taxonomyController.js';

// Public read of the admin-curated categories + tags (consumed by the ask form).
const router = Router();
router.get('/', ctrl.list);

export default router;
