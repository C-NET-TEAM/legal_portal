import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { connectDB } from "./db.js";
import Alert from "./models/Alert.js";
import Case from "./models/Case.js";
import SmsUser from "./models/SmsUser.js";
import User from "./models/User.js";
import { processDocuments, UPLOAD_DIR, upload } from "./upload.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_SECRET_KEY =
	process.env.ADMIN_SECRET_KEY || "cnet-admin-secret-2026";

// Sanitize user inputs before constructing RegExp to prevent ReDoS / query injection
function escapeRegExp(string) {
	return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Password verification supporting both bcrypt and seamless legacy plaintext migration
async function verifyPassword(inputPassword, storedPassword) {
	if (!storedPassword || !inputPassword) return false;
	if (
		storedPassword.startsWith("$2a$") ||
		storedPassword.startsWith("$2b$") ||
		storedPassword.startsWith("$2y$")
	) {
		return bcrypt.compare(inputPassword, storedPassword);
	}
	// Fallback for existing plaintext passwords
	return inputPassword === storedPassword;
}

// Security headers via Helmet (configured to allow cross-origin resource access for file previews)
app.use(
	helmet({
		crossOriginResourcePolicy: { policy: "cross-origin" },
	}),
);

// Trusted frontend origins whitelist
const ALLOWED_ORIGINS = [
	"http://localhost:5173",
	"http://localhost:5174",
	"http://localhost:3000",
	"http://127.0.0.1:5173",
	"http://127.0.0.1:5174",
	"http://127.0.0.1:3000",
	"https://legal-portal-pi-seven.vercel.app",
];
if (process.env.FRONTEND_URL) {
	const extraOrigins = process.env.FRONTEND_URL.split(",")
		.map((u) => u.trim().replace(/\/+$/, ""))
		.filter(Boolean);
	ALLOWED_ORIGINS.push(...extraOrigins);
}

function isOriginAllowed(origin) {
	if (!origin) return true; // Allow non-browser requests (curl, server-to-server, mobile)
	const cleanOrigin = origin.replace(/\/+$/, "");
	if (ALLOWED_ORIGINS.includes(cleanOrigin)) return true;
	// Allow all Vercel deployments (production & branch previews)
	if (/^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(cleanOrigin)) return true;
	// Allow all sslip.io hostnames
	if (/^https?:\/\/[a-zA-Z0-9_.-]+\.sslip\.io(:\d+)?$/.test(cleanOrigin)) return true;
	// Allow any localhost / 127.0.0.1 on any port
	if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) return true;
	return false;
}

app.use(
	cors({
		origin: (origin, callback) => {
			if (isOriginAllowed(origin)) {
				return callback(null, true);
			}
			console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
			return callback(null, false);
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
	}),
);

// Rate limiter for authentication endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 50, // 50 requests per windowMs per IP
	message: {
		error:
			"Too many authentication attempts from this IP. Please try again in 15 minutes.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

// Parse JSON and urlencoded bodies (reduced from 200MB to 25MB for safety against memory exhaustion DoS)
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Static file server for EBS uploaded media files
app.use("/api/uploads", express.static(UPLOAD_DIR));

// Health check endpoint
app.get("/api/health", async (_req, res) => {
	return res.json({
		status: "healthy",
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
		ebsUploadDir: UPLOAD_DIR,
		database: "MongoDB Atlas",
	});
});

// ================= FILE UPLOAD ROUTE (EBS DISK STORAGE) =================
// Direct multipart/form-data upload route
app.post("/api/upload", upload.array("files", 10), (req, res) => {
	try {
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({ error: "No files were uploaded." });
		}

		const uploadedDocuments = req.files.map((file) => {
			const sizeMB = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
			return {
				name: file.originalname,
				size: sizeMB,
				mimetype: file.mimetype,
				filename: file.filename,
				url: `/api/uploads/${file.filename}`,
				uploadedAt: new Date(),
			};
		});

		return res.json({ success: true, files: uploadedDocuments });
	} catch (error) {
		console.error("File upload error:", error);
		return res.status(500).json({ error: "Failed to process file upload." });
	}
});

// ================= AUTH ROUTES =================
app.post("/api/auth/register", authLimiter, async (req, res) => {
	try {
		const { clientId, name, password } = req.body;
		if (!clientId || !name || !password) {
			return res
				.status(400)
				.json({ error: "Client ID, Name, and Password are required." });
		}

		const existing = await User.findOne({
			clientId: new RegExp(`^${escapeRegExp(clientId.trim())}$`, "i"),
		});
		if (existing) {
			return res.status(400).json({
				error: "Client ID already exists. Please choose another or log in.",
			});
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = await User.create({
			clientId: clientId.trim(),
			name: name.trim(),
			password: hashedPassword,
		});

		return res.json({
			success: true,
			user: { clientId: newUser.clientId, name: newUser.name },
		});
	} catch (err) {
		console.error("Register error:", err);
		return res
			.status(500)
			.json({ error: "Internal server error during registration." });
	}
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
	try {
		const { clientId, password } = req.body;
		if (!clientId || !password) {
			return res
				.status(400)
				.json({ error: "Client ID and Password are required." });
		}

		const user = await User.findOne({
			clientId: new RegExp(`^${escapeRegExp(clientId.trim())}$`, "i"),
		});

		if (!user || !(await verifyPassword(password, user.password))) {
			return res.status(401).json({ error: "Invalid Client ID or Password." });
		}

		// Seamless migration: auto-upgrade legacy plaintext password to bcrypt hash on successful login
		if (
			!user.password.startsWith("$2a$") &&
			!user.password.startsWith("$2b$") &&
			!user.password.startsWith("$2y$")
		) {
			user.password = await bcrypt.hash(password, 10);
			await user.save();
		}

		return res.json({
			success: true,
			user: { clientId: user.clientId, name: user.name },
		});
	} catch (err) {
		console.error("Login error:", err);
		return res
			.status(500)
			.json({ error: "Internal server error during login." });
	}
});

app.post("/api/auth/change-password", authLimiter, async (req, res) => {
	try {
		const { clientId, oldPassword, newPassword } = req.body;
		if (!clientId || !oldPassword || !newPassword) {
			return res.status(400).json({ error: "All fields are required." });
		}

		const user = await User.findOne({
			clientId: new RegExp(`^${escapeRegExp(clientId.trim())}$`, "i"),
		});
		if (!user) {
			return res.status(404).json({ error: "User not found." });
		}

		if (!(await verifyPassword(oldPassword, user.password))) {
			return res.status(400).json({ error: "Current password is incorrect." });
		}

		user.password = await bcrypt.hash(newPassword, 10);
		await user.save();
		return res.json({
			success: true,
			message: "Password updated successfully.",
		});
	} catch (err) {
		console.error("Change password error:", err);
		return res.status(500).json({ error: "Internal server error." });
	}
});

app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
	try {
		const { clientId, token, newPassword } = req.body;
		if (!clientId) {
			return res.status(400).json({ error: "Client ID is required." });
		}

		const user = await User.findOne({
			clientId: new RegExp(`^${escapeRegExp(clientId.trim())}$`, "i"),
		});
		if (!user) {
			return res.status(404).json({ error: "Client ID not registered." });
		}

		// Step 1: Token request (if newPassword or token not provided)
		if (!token || !newPassword) {
			const resetToken = crypto.randomBytes(3).toString("hex").toUpperCase();
			user.resetPasswordToken = resetToken;
			user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
			await user.save();

			return res.json({
				success: true,
				message:
					"Password reset token generated. Use this token to reset your password within 15 minutes.",
				token: resetToken,
			});
		}

		// Step 2: Token verification and password reset
		if (
			!user.resetPasswordToken ||
			user.resetPasswordToken !== token.trim() ||
			!user.resetPasswordExpires ||
			user.resetPasswordExpires < new Date()
		) {
			return res.status(400).json({
				error:
					"Invalid or expired password reset token. Please request a new token.",
			});
		}

		user.password = await bcrypt.hash(newPassword, 10);
		user.resetPasswordToken = null;
		user.resetPasswordExpires = null;
		await user.save();

		return res.json({
			success: true,
			message:
				"Password reset successfully. You can now log in with your new password.",
		});
	} catch (err) {
		console.error("Forgot password error:", err);
		return res.status(500).json({ error: "Internal server error." });
	}
});

// ================= SMS AUTH ROUTES =================
app.post("/api/sms/auth/register", authLimiter, async (req, res) => {
	try {
		const { smsId, password, position } = req.body;
		if (!smsId || !password) {
			return res
				.status(400)
				.json({ error: "SMS ID and Password are required." });
		}

		// Password validation
		const passwordRegex =
			/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
		if (!passwordRegex.test(password)) {
			return res.status(400).json({
				error:
					"Password must be at least 6 characters and contain letters, numbers, and symbols.",
			});
		}

		const existing = await SmsUser.findOne({
			smsId: new RegExp(`^${escapeRegExp(smsId.trim())}$`, "i"),
		});
		if (existing) {
			const num1 = Math.floor(100 + Math.random() * 900);
			const num2 = Math.floor(1000 + Math.random() * 9000);
			return res.status(400).json({
				error: "SMS ID already exists.",
				suggestions: [`${smsId}${num1}`, `${smsId}_${num2}`],
			});
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = await SmsUser.create({
			smsId: smsId.trim(),
			firstName: "Specialist",
			middleName: "",
			lastName: smsId.trim(),
			position: position || "",
			password: hashedPassword,
			profileImage: null,
		});

		return res.json({ success: true, user: newUser });
	} catch (err) {
		console.error("SMS Register error:", err);
		return res.status(500).json({ error: "Internal server error." });
	}
});

app.post("/api/sms/auth/login", authLimiter, async (req, res) => {
	try {
		const { smsId, password } = req.body;
		if (!smsId || !password) {
			return res
				.status(400)
				.json({ error: "SMS ID and Password are required." });
		}

		const user = await SmsUser.findOne({
			smsId: new RegExp(`^${escapeRegExp(smsId.trim())}$`, "i"),
		});

		if (!user || !(await verifyPassword(password, user.password))) {
			return res.status(401).json({ error: "Invalid SMS ID or Password." });
		}

		// Seamless migration: auto-upgrade legacy plaintext password to bcrypt hash on successful login
		if (
			!user.password.startsWith("$2a$") &&
			!user.password.startsWith("$2b$") &&
			!user.password.startsWith("$2y$")
		) {
			user.password = await bcrypt.hash(password, 10);
			await user.save();
		}

		return res.json({
			success: true,
			user: {
				smsId: user.smsId,
				firstName: user.firstName,
				middleName: user.middleName,
				lastName: user.lastName,
				position: user.position,
				profileImage: user.profileImage,
			},
		});
	} catch (err) {
		console.error("SMS Login error:", err);
		return res.status(500).json({ error: "Internal server error." });
	}
});

app.post("/api/sms/auth/change-password", authLimiter, async (req, res) => {
	try {
		const { smsId, oldPassword, newPassword } = req.body;
		if (!smsId || !oldPassword || !newPassword) {
			return res.status(400).json({
				error: "SMS ID, old password, and new password are required.",
			});
		}

		const passwordRegex =
			/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
		if (!passwordRegex.test(newPassword)) {
			return res.status(400).json({
				error:
					"New password must be at least 6 characters and contain letters, numbers, and symbols.",
			});
		}

		const user = await SmsUser.findOne({
			smsId: new RegExp(`^${escapeRegExp(smsId.trim())}$`, "i"),
		});
		if (!user) {
			return res.status(404).json({ error: "SMS User not found." });
		}

		if (!(await verifyPassword(oldPassword, user.password))) {
			return res.status(401).json({ error: "Incorrect current password." });
		}

		user.password = await bcrypt.hash(newPassword, 10);
		await user.save();
		return res.json({
			success: true,
			message: "Password updated successfully.",
		});
	} catch (err) {
		console.error("SMS Change password error:", err);
		return res.status(500).json({ error: "Internal server error." });
	}
});

const normalizeCase = (c) => {
	if (!c) return c;
	const doc = c.toObject ? c.toObject() : { ...c };
	doc.clientType = doc.clientType || "Individual";
	doc.title = doc.title || (doc.clientType === "Individual" ? "Mr." : "");
	doc.caseVertical = doc.caseVertical || doc.category || "MSME";
	doc.category = doc.caseVertical || doc.category || "MSME";
	doc.caseCategory = doc.caseCategory || doc.caseKeywords || "Deputation Related";
	doc.caseKeywords = doc.caseCategory || doc.caseKeywords || "Deputation Related";
	doc.summary = doc.summary || (doc.id === "CASE-04" ? "Case summary details for Yash." : "");
	doc.selectedDocuments = doc.selectedDocuments || [];
	return doc;
};

// ================= CASES ROUTES =================
app.get("/api/cases", async (req, res) => {
	try {
		const { clientId } = req.query;
		const filter = clientId
			? { clientId: new RegExp(`^${escapeRegExp(clientId.trim())}$`, "i") }
			: {};
		const cases = await Case.find(filter).sort({ createdAt: -1 });
		return res.json(cases.map(normalizeCase));
	} catch (err) {
		console.error("Get cases error:", err);
		return res.status(500).json({ error: "Failed to fetch cases." });
	}
});

app.get("/api/cases/:id", async (req, res) => {
	try {
		const caseItem = await Case.findOne({ id: req.params.id });
		if (!caseItem) {
			return res.status(404).json({ error: "Case not found." });
		}
		return res.json(normalizeCase(caseItem));
	} catch (err) {
		console.error("Get case by ID error:", err);
		return res.status(500).json({ error: "Failed to fetch case." });
	}
});

// CMS Submit New Case
app.post("/api/cases", async (req, res) => {
	try {
		const {
			id,
			clientId,
			clientType,
			title,
			clientName,
			city,
			state,
			details,
			summary,
			caseKeywords,
			caseCategory,
			category,
			caseVertical,
			documents,
			targetSme,
		} = req.body;

		if (!clientName || !details) {
			return res
				.status(400)
				.json({ error: "Name and Case Details are required." });
		}

		// Process documents: convert any Base64 strings to EBS disk files
		const processedDocs = processDocuments(documents || []);

		// Ensure globally unique case ID
		let caseId = id ? String(id).trim() : null;
		if (caseId) {
			const existing = await Case.findOne({ id: caseId });
			if (existing) {
				// ID is already taken, generate a unique ID to prevent duplicate key error
				caseId = null;
			}
		}

		if (!caseId) {
			const allCases = await Case.find({}, { id: 1 }).lean();
			let maxSeq = 0;
			const existingIds = new Set();
			for (const c of allCases || []) {
				if (!c.id) continue;
				existingIds.add(c.id);
				const match = c.id.match(/^CASE-(\d+)$/i);
				if (match) {
					const num = parseInt(match[1], 10);
					if (num < 1000 && num > maxSeq) {
						maxSeq = num;
					}
				}
			}

			let nextNum = maxSeq + 1;
			caseId = `CASE-${nextNum.toString().padStart(2, "0")}`;
			while (existingIds.has(caseId)) {
				nextNum++;
				caseId = `CASE-${nextNum.toString().padStart(2, "0")}`;
			}
		}

		const resolvedType = clientType === "Institute" ? "Institute" : "Individual";
		const resolvedTitle = resolvedType === "Individual" ? (title || "Mr.") : "";
		const resolvedVertical = category || caseVertical || "MSME";
		const resolvedCategory = caseCategory || caseKeywords || "Deputation Related";
		const resolvedSummary = summary || "";

		const newCase = await Case.create({
			id: caseId,
			clientId: clientId || "GUEST",
			clientType: resolvedType,
			title: resolvedTitle,
			clientName,
			age: "",
			sex: "",
			city: city || "N/A",
			state: state || "N/A",
			details,
			summary: resolvedSummary,
			caseKeywords: resolvedCategory,
			caseCategory: resolvedCategory,
			category: resolvedVertical,
			caseVertical: resolvedVertical,
			documents: processedDocs,
			status: "Pending",
			targetSme: targetSme || "",
			smsNotes: "",
			lexPrompt: "",
			lexOutput: "",
			finalFeedback: "",
			chats: [],
		});

		return res.json({ success: true, case: normalizeCase(newCase) });
	} catch (err) {
		console.error("Create case error:", err);
		return res
			.status(500)
			.json({ error: err.message || "Failed to submit case." });
	}
});

// Delete Case (Protected: Only owning client or authorized admin can delete)
app.delete("/api/cases/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const existingCase = await Case.findOne({ id });
		if (!existingCase) {
			return res.status(404).json({ error: "Case not found." });
		}

		const requesterClientId = req.headers["x-client-id"];
		const requesterAdminKey = req.headers["x-admin-key"];
		const isAdmin = requesterAdminKey && requesterAdminKey === ADMIN_SECRET_KEY;
		const isOwner =
			requesterClientId &&
			existingCase.clientId &&
			requesterClientId.trim().toLowerCase() ===
				existingCase.clientId.trim().toLowerCase();

		if (!isAdmin && !isOwner) {
			return res.status(403).json({
				error:
					"Forbidden: You are not authorized to delete this case. Only the owner or administrator can delete cases.",
			});
		}

		const result = await Case.deleteOne({ id });
		return res.json({ success: true, deletedCount: result.deletedCount });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
});

// Admin route: purge all inner data (cases, alerts, uploaded files) while keeping user and specialist login credentials
// Protected: Requires valid x-admin-key header matching ADMIN_SECRET_KEY
app.post("/api/admin/clean-data", async (req, res) => {
	try {
		const providedKey = req.headers["x-admin-key"] || req.query.adminKey;
		if (!providedKey || providedKey !== ADMIN_SECRET_KEY) {
			return res.status(401).json({
				error:
					"Unauthorized: Valid administrative key required in x-admin-key header.",
			});
		}

		const deletedCases = await Case.deleteMany({});
		const deletedAlerts = await Alert.deleteMany({});

		let deletedFilesCount = 0;
		if (fs.existsSync(UPLOAD_DIR)) {
			const files = fs.readdirSync(UPLOAD_DIR);
			for (const file of files) {
				try {
					fs.unlinkSync(path.join(UPLOAD_DIR, file));
					deletedFilesCount++;
				} catch (e) {
					console.error("Failed to delete file from upload dir:", file, e);
				}
			}
		}

		return res.json({
			success: true,
			message:
				"All case data, alerts, and uploaded files deleted successfully. User logins preserved.",
			deletedCases: deletedCases.deletedCount,
			deletedAlerts: deletedAlerts.deletedCount,
			deletedFiles: deletedFilesCount,
		});
	} catch (err) {
		console.error("Clean data error:", err);
		return res.status(500).json({ error: err.message });
	}
});

// SMS Specialist Reviews & Approves Case
app.post("/api/cases/:id/review", async (req, res) => {
	try {
		const { id } = req.params;
		const { status, smsNotes, lexPrompt, reviewerInfo, selectedDocuments } = req.body;

		const caseItem = await Case.findOne({ id });
		if (!caseItem) {
			return res.status(404).json({ error: "Case not found." });
		}

		caseItem.status = status || "Approved";
		if (smsNotes !== undefined) caseItem.smsNotes = smsNotes;
		if (lexPrompt !== undefined) caseItem.lexPrompt = lexPrompt;
		if (reviewerInfo) caseItem.reviewerInfo = reviewerInfo;
		if (selectedDocuments !== undefined) caseItem.selectedDocuments = selectedDocuments;

		await caseItem.save();

		// Create notification alert for CMS client
		const alertCount = await Alert.countDocuments();
		const alertId = `ALT-${(alertCount + 1).toString().padStart(2, "0")}`;
		const newAlert = await Alert.create({
			id: alertId,
			caseId: id,
			title: `SMS Reply on ${id}: ${caseItem.status}`,
			message: smsNotes || `Your case ${id} has been reviewed by SMS.`,
			structuredData: {
				caseId: id,
				clientName: caseItem.clientName,
				title: caseItem.title || "",
				clientType: caseItem.clientType || "Individual",
				status: caseItem.status,
				category: caseItem.category || caseItem.caseVertical || "MSME",
				caseVertical: caseItem.caseVertical || caseItem.category || "MSME",
				caseCategory: caseItem.caseCategory || caseItem.caseKeywords || "Deputation Related",
				summary: caseItem.summary || "",
				details: caseItem.details || "",
				selectedDocuments: caseItem.selectedDocuments || selectedDocuments || [],
				smsNotes: caseItem.smsNotes,
				lexPrompt: caseItem.lexPrompt,
				reviewerInfo: caseItem.reviewerInfo,
			},
			read: false,
		});

		return res.json({ success: true, case: normalizeCase(caseItem), alert: newAlert });
	} catch (err) {
		console.error("Case review error:", err);
		return res.status(500).json({ error: "Failed to review case." });
	}
});

// CMS Submits Lex AI Output to SMS
app.post("/api/cases/:id/lex-output", async (req, res) => {
	try {
		const { id } = req.params;
		const { lexOutput } = req.body;

		const caseItem = await Case.findOne({ id });
		if (!caseItem) {
			return res.status(404).json({ error: "Case not found." });
		}

		caseItem.lexOutput = lexOutput;
		caseItem.status = "AI Output Submitted";
		await caseItem.save();

		return res.json({ success: true, case: normalizeCase(caseItem) });
	} catch (err) {
		console.error("Lex output submit error:", err);
		return res.status(500).json({ error: "Failed to submit Lex AI output." });
	}
});

// SMS Final Review on Lex AI Output (Approved or Sudhar / Revisions)
app.post("/api/cases/:id/final-review", async (req, res) => {
	try {
		const { id } = req.params;
		const { finalStatus, finalFeedback, revisedPrompt, reviewerInfo } =
			req.body;

		const caseItem = await Case.findOne({ id });
		if (!caseItem) {
			return res.status(404).json({ error: "Case not found." });
		}

		caseItem.status = finalStatus || "Completed";
		caseItem.finalFeedback = finalFeedback || "";
		if (revisedPrompt) caseItem.lexPrompt = revisedPrompt;
		if (reviewerInfo) caseItem.reviewerInfo = reviewerInfo;

		await caseItem.save();

		// Create alert for CMS
		const alertCount = await Alert.countDocuments();
		const alertId = `ALT-${(alertCount + 1).toString().padStart(2, "0")}`;
		const newAlert = await Alert.create({
			id: alertId,
			caseId: id,
			title: `Final SMS Feedback: ${caseItem.status}`,
			message: finalFeedback || `SMS has completed final evaluation for ${id}.`,
			structuredData: {
				caseId: id,
				status: caseItem.status,
				category: caseItem.category,
				smsNotes: caseItem.finalFeedback,
				lexPrompt: caseItem.lexPrompt,
				reviewerInfo: caseItem.reviewerInfo,
			},
			read: false,
		});

		return res.json({ success: true, case: normalizeCase(caseItem), alert: newAlert });
	} catch (err) {
		console.error("Final review error:", err);
		return res.status(500).json({ error: "Failed to submit final review." });
	}
});

// Chat Endpoint (CMS & SMS)
app.post("/api/cases/:id/chat", async (req, res) => {
	try {
		const { id } = req.params;
		const { sender, text, documents } = req.body;

		const caseItem = await Case.findOne({ id });
		if (!caseItem) {
			return res.status(404).json({ error: "Case not found." });
		}

		// Process attached documents to EBS storage
		const processedDocs = processDocuments(documents || []);

		const newMessage = {
			sender,
			text: text || "",
			documents: processedDocs,
			readByCms: sender === "cms",
			readBySms: sender === "sms",
			timestamp: new Date().toISOString(),
		};

		caseItem.chats.push(newMessage);
		await caseItem.save();

		// If sender is SMS, generate a real-time notification alert for CMS
		if (sender === "sms") {
			const alertCount = await Alert.countDocuments();
			await Alert.create({
				id: `ALT-${Date.now().toString().slice(-4)}${alertCount + 1}`,
				caseId: id,
				title: `SMS Reply on ${id}: ${caseItem.status === "Approved" ? "Under Review" : caseItem.status}`,
				message:
					text ||
					(processedDocs.length > 0
						? `Sent ${processedDocs.length} attachment(s)`
						: "New reply from specialist"),
				structuredData: {
					caseId: id,
					clientName: caseItem.clientName,
					status: caseItem.status,
					category: caseItem.category,
					smsNotes: text,
					reviewerInfo: caseItem.reviewerInfo,
				},
				read: false,
			});
		}

		return res.json({ success: true, case: normalizeCase(caseItem), message: newMessage });
	} catch (err) {
		console.error("Send chat error:", err);
		return res.status(500).json({ error: "Failed to send chat message." });
	}
});

// Mark all alerts & chats for a case as read by CMS
app.post("/api/cases/:id/mark-read", async (req, res) => {
	try {
		const { id } = req.params;

		await Alert.updateMany({ caseId: id }, { read: true });

		const caseItem = await Case.findOne({ id });
		if (caseItem?.chats) {
			caseItem.chats.forEach((ch) => {
				ch.readByCms = true;
			});
			await caseItem.save();
		}

		return res.json({ success: true });
	} catch (err) {
		console.error("Mark read error:", err);
		return res.status(500).json({ error: "Failed to mark case read." });
	}
});

// Mark all chats for a case as read by SMS
app.post("/api/cases/:id/mark-sms-read", async (req, res) => {
	try {
		const { id } = req.params;

		const caseItem = await Case.findOne({ id });
		if (caseItem?.chats) {
			caseItem.chats.forEach((ch) => {
				ch.readBySms = true;
			});
			await caseItem.save();
		}

		return res.json({ success: true });
	} catch (err) {
		console.error("Mark SMS read error:", err);
		return res.status(500).json({ error: "Failed to mark case read by SMS." });
	}
});

// Complete Case Endpoint (SMS Only)
app.post("/api/cases/:id/complete", async (req, res) => {
	try {
		const { id } = req.params;
		const { smsId, password } = req.body;

		const smsUser = await SmsUser.findOne({
			smsId: new RegExp(`^${escapeRegExp(smsId.trim())}$`, "i"),
		});

		if (!smsUser || !(await verifyPassword(password, smsUser.password))) {
			return res.status(401).json({ error: "Invalid SMS ID or Password." });
		}

		const caseItem = await Case.findOne({ id });
		if (!caseItem) {
			return res.status(404).json({ error: "Case not found." });
		}

		caseItem.status = "Completed";
		await caseItem.save();

		return res.json({ success: true, case: caseItem });
	} catch (err) {
		console.error("Complete case error:", err);
		return res.status(500).json({ error: "Failed to complete case." });
	}
});

// ================= ALERTS ROUTES =================
app.get("/api/alerts", async (_req, res) => {
	try {
		const alerts = await Alert.find().sort({ createdAt: -1 });
		return res.json(alerts);
	} catch (err) {
		console.error("Get alerts error:", err);
		return res.status(500).json({ error: "Failed to fetch alerts." });
	}
});

app.post("/api/alerts/:id/read", async (req, res) => {
	try {
		const { id } = req.params;
		await Alert.findOneAndUpdate({ id }, { read: true });
		return res.json({ success: true });
	} catch (err) {
		console.error("Alert mark read error:", err);
		return res.status(500).json({ error: "Failed to update alert." });
	}
});

app.post("/api/alerts/mark-all-read", async (_req, res) => {
	try {
		await Alert.updateMany({}, { read: true });
		return res.json({ success: true });
	} catch (err) {
		console.error("Alerts mark all read error:", err);
		return res.status(500).json({ error: "Failed to mark all alerts read." });
	}
});

// Global Express error-handling middleware (masks stack traces and sensitive error details in production)
app.use((err, _req, res, _next) => {
	console.error("Unhandled Application Error:", err);
	const statusCode = err.status || err.statusCode || 500;
	return res.status(statusCode).json({
		error:
			process.env.NODE_ENV === "production"
				? "An unexpected internal server error occurred."
				: err.message || "Internal server error.",
	});
});

// ================= SERVER START =================
function getNetworkIp() {
	const nets = os.networkInterfaces();
	for (const name of Object.keys(nets)) {
		for (const net of nets[name]) {
			if (net.family === "IPv4" && !net.internal) {
				return net.address;
			}
		}
	}
	return "localhost";
}

async function startServer() {
	try {
		// Connect to MongoDB Atlas first
		await connectDB();

		app.listen(PORT, "0.0.0.0", () => {
			const lanIp = getNetworkIp();
			console.log(`\n======================================================`);
			console.log(`  CMS-SMS BACKEND SERVER RUNNING (MONGODB + AWS EBS)`);
			console.log(`  Local:   http://localhost:${PORT}`);
			console.log(`  Network: http://${lanIp}:${PORT}`);
			console.log(`  EBS Media Dir: ${UPLOAD_DIR}`);
			console.log(`======================================================\n`);
		});
	} catch (err) {
		console.error("Server startup error:", err);
		process.exit(1);
	}
}

startServer();
