import { Router } from 'express';

import { handleListModels } from '@/modules/models/models.controller';

const router = Router();

/**
 * @openapi
 * /api/models:
 *   get:
 *     summary: List enabled AI models
 *     tags: [Models]
 *     responses:
 *       200:
 *         description: List of available models
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/models', handleListModels);

export default router;
