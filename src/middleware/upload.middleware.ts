import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();

const multerUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    // Accepte audio/* et application/octet-stream (n8n envoie du binaire générique)
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error(`Format non supporté: ${file.mimetype}`));
    }
  },
}).single('audio');

// Wrapper pour convertir les erreurs multer en JSON (évite la page HTML d'erreur)
export const uploadAudio = (req: Request, res: Response, next: NextFunction): void => {
  multerUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      res.status(422).json({ success: false, message: `Erreur upload: ${err.message}` });
    } else if (err) {
      res.status(422).json({ success: false, message: err.message });
    } else {
      next();
    }
  });
};
