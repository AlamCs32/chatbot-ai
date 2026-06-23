import type { Request, Response } from 'express';

import { models } from '@/ai/models/registry';

export function handleListModels(_req: Request, res: Response): void {
  res.json(models.filter((m) => m.enabled));
}
