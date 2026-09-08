import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'));

// Ensure the EBS upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Created EBS upload directory: ${UPLOAD_DIR}`);
}

// Multer disk storage for EBS
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase}_${uniqueSuffix}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max for legal files / exhibits
  }
});

/**
 * Saves a base64 document or data-uri to the EBS upload directory and returns
 * a clean document metadata object with a relative URL.
 */
export function saveBase64ToEBS(doc) {
  if (!doc) return null;

  const { name = 'attachment', size = '', url = '' } = doc;

  // If already hosted or not base64, return as is
  if (!url || !url.startsWith('data:')) {
    return {
      name,
      size,
      mimetype: doc.mimetype || '',
      filename: doc.filename || '',
      url: url || ''
    };
  }

  try {
    const matches = url.match(/^data:([A-Za-z0-9-+\/.]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      console.warn(`Malformed base64 data for file: ${name}`);
      return { name, size, url: '' };
    }

    const mimetype = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Determine extension
    let ext = path.extname(name).toLowerCase();
    if (!ext) {
      const mimeExtMap = {
        'application/pdf': '.pdf',
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/avif': '.avif',
        'image/webp': '.webp',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'text/plain': '.txt'
      };
      ext = mimeExtMap[mimetype] || '.bin';
    }

    const safeBase = path.basename(name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40) || 'doc';
    const filename = `${safeBase}_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    const calculatedSize = `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`;

    return {
      name,
      size: size || calculatedSize,
      mimetype,
      filename,
      url: `/api/uploads/${filename}`,
      uploadedAt: new Date()
    };
  } catch (err) {
    console.error(`Error saving base64 file "${name}" to EBS:`, err);
    return { name, size, url: '' };
  }
}

/**
 * Batch processes an array of documents, saving any Base64 strings to EBS
 */
export function processDocuments(docArray = []) {
  if (!Array.isArray(docArray)) return [];
  return docArray.map(doc => saveBase64ToEBS(doc)).filter(Boolean);
}
