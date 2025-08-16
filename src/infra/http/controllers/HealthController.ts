import { Request, Response } from 'express';

export function healthHandler(req: Request, res: Response): void {
  res.json({ status: 'ok', time: new Date().toISOString() });
}