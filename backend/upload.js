import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOAD_DIR = path.resolve(
	process.env.UPLOAD_DIR || path.join(__dirname, "uploads"),
);

// Ensure the EBS upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
	fs.mkdirSync(UPLOAD_DIR, { recursive: true });
	console.log(`Created EBS upload directory: ${UPLOAD_DIR}`);
}

// Strictly permitted file types for legal documents and evidence
const ALLOWED_MIME_TYPES = new Set([
	"application/pdf",
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"text/plain",
]);

const ALLOWED_EXTENSIONS = new Set([
	".pdf",
	".jpg",
	".jpeg",
	".png",
	".webp",
	".doc",
	".docx",
	".txt",
]);

// Multer disk storage for EBS
const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, UPLOAD_DIR);
	},
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase();
		const safeBase = path
			.basename(file.originalname, ext)
			.replace(/[^a-zA-Z0-9_-]/g, "_")
			.substring(0, 50);
		const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
		cb(null, `${safeBase}_${uniqueSuffix}${ext}`);
	},
});

export const upload = multer({
	storage,
	limits: {
		fileSize: 100 * 1024 * 1024, // 100 MB max for legal files / exhibits
	},
	fileFilter: (_req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase();
		const mime = file.mimetype.toLowerCase();

		if (ALLOWED_EXTENSIONS.has(ext) && ALLOWED_MIME_TYPES.has(mime)) {
			cb(null, true);
		} else {
			cb(
				new Error(
					`File upload rejected: "${file.originalname}" is not an allowed document type. Only PDF, DOC, DOCX, Images (JPG, PNG, WEBP), and TXT are permitted.`,
				),
			);
		}
	},
});

/**
 * Saves a base64 document or data-uri to the EBS upload directory and returns
 * a clean document metadata object with a relative URL.
 */
function saveBase64ToEBS(doc) {
	if (!doc) return null;

	const { name = "attachment", size = "", url = "" } = doc;

	// If already hosted or not base64, return as is
	if (!url?.startsWith("data:")) {
		return {
			name,
			size,
			mimetype: doc.mimetype || "",
			filename: doc.filename || "",
			url: url || "",
		};
	}

	try {
		const matches = url.match(/^data:([A-Za-z0-9-+/.]+);base64,(.+)$/);
		if (matches?.length !== 3) {
			console.warn(`Malformed base64 data for file: ${name}`);
			return { name, size, url: "" };
		}

		const mimetype = matches[1].toLowerCase();

		// Determine extension
		let ext = path.extname(name).toLowerCase();
		if (!ext) {
			const mimeExtMap = {
				"application/pdf": ".pdf",
				"image/jpeg": ".jpg",
				"image/jpg": ".jpg",
				"image/png": ".png",
				"image/webp": ".webp",
				"application/msword": ".doc",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
					".docx",
				"text/plain": ".txt",
			};
			ext = mimeExtMap[mimetype] || "";
		}

		// Security validation: verify allowed MIME type and extension
		if (!ALLOWED_MIME_TYPES.has(mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
			console.warn(
				`Security alert: Blocked upload of prohibited file type "${mimetype}" / "${ext}" for file "${name}".`,
			);
			return { name, size, url: "" };
		}

		const base64Data = matches[2];
		const buffer = Buffer.from(base64Data, "base64");

		const safeBase =
			path
				.basename(name, ext)
				.replace(/[^a-zA-Z0-9_-]/g, "_")
				.substring(0, 40) || "doc";
		const randomSuffix = crypto.randomBytes(6).toString("hex");
		const filename = `${safeBase}_${Date.now()}_${randomSuffix}${ext}`;
		const filePath = path.join(UPLOAD_DIR, filename);

		fs.writeFileSync(filePath, buffer);

		const calculatedSize = `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`;

		return {
			name,
			size: size || calculatedSize,
			mimetype,
			filename,
			url: `/api/uploads/${filename}`,
			uploadedAt: new Date(),
		};
	} catch (err) {
		console.error(`Error saving base64 file "${name}" to EBS:`, err);
		return { name, size, url: "" };
	}
}

/**
 * Batch processes an array of documents, saving any Base64 strings to EBS
 */
export function processDocuments(docArray = []) {
	if (!Array.isArray(docArray)) return [];
	return docArray.map((doc) => saveBase64ToEBS(doc)).filter(Boolean);
}
