import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import multer, { StorageEngine, FileFilterCallback } from "multer";
import { Request } from "express";

// Configure storage
const storage: StorageEngine = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, path.join(__dirname, "../../public/temp"));
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
// Usage example: upload.single('profileImage') or upload.array('files', maxCount) 