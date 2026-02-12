import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

/**
 * Express middleware to protect Bull Board UI route.
 * Bull Board uses Express-level middleware, not NestJS guards.
 * Validates JWT token and checks for ADMIN role.
 */
export function bullBoardAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized: Token ausente' });
    return;
  }

  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ message: 'JWT_SECRET not configured' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as {
      sub: string;
      role: string;
    };

    if (payload.role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden: Apenas ADMIN pode acessar' });
      return;
    }

    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized: Token inválido' });
  }
}
