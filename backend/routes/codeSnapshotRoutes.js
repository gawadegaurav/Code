import express from 'express';
import { saveSnapshot, getSnapshot } from '../controllers/codeSnapshotController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, saveSnapshot);

router.route('/:roomId')
    .get(protect, getSnapshot);

export default router;
