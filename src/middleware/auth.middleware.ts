import { Request, Response, NextFunction } from 'express';

export interface AIRequest extends Request {
  userId?: string;
  tenantId?: string;
  accessToken?: string;
}

export const authenticate = (req: AIRequest, res: Response, next: NextFunction): void => {
  // Le token JWT de l'utilisateur final (transmis depuis mobile/WhatsApp)
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token manquant' });
    return;
  }

  const token = authHeader.split(' ')[1]!;

  // Décoder le payload sans vérifier la signature (api-btp s'en charge)
  // On extrait juste tenantId et userId pour le contexte
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64').toString());
    req.userId = payload.userId;
    req.tenantId = payload.tenantId;
    req.accessToken = token;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
};
