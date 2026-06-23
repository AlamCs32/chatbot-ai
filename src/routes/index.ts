import { Router } from 'express';
import chatRoutes from '@/modules/chat/chat.routes';
import documentRoutes from '@/modules/documents/documents.routes';
import modelRoutes from '@/modules/models/models.routes';

const router = Router();

router.use('/api', chatRoutes, documentRoutes, modelRoutes);

export default router;
