import { useEffect, useRef, useState } from "react";
import { api, getApiBase } from "../../api";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

// Clean SVG Icons matching CMS feather/lucide line aesthetic
const Icons = {
	Folder: () => (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
		</svg>
	),
	File: () => (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<polyline points="14 2 14 8 20 8" />
		</svg>
	),
	Paperclip: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
		</svg>
	),
	Send: () => (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<line x1="22" y1="2" x2="11" y2="13" />
			<polygon points="22 2 15 22 11 13 2 9 22 2" />
		</svg>
	),
	Edit: () => (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
			<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
		</svg>
	),
	ExternalLink: () => (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
			<polyline points="15 3 21 3 21 9" />
			<line x1="10" y1="14" x2="21" y2="3" />
		</svg>
	),
	Check: () => (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<polyline points="20 6 9 17 4 12" />
		</svg>
	),
	Clock: () => (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<circle cx="12" cy="12" r="10" />
			<polyline points="12 6 12 12 16 14" />
		</svg>
	),
	ChevronDown: () => (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<polyline points="6 9 12 15 18 9" />
		</svg>
	),
	ChevronUp: () => (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<polyline points="18 15 12 9 6 15" />
		</svg>
	),
	Close: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<line x1="18" y1="6" x2="6" y2="18" />
			<line x1="6" y1="6" x2="18" y2="18" />
		</svg>
	),
	User: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
			<circle cx="12" cy="7" r="4" />
		</svg>
	),
	ClipboardCheck: () => (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
			<rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
			<polyline points="9 14 11 16 15 11" />
		</svg>
	),
	Download: () => (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<polyline points="7 10 12 15 17 10" />
			<line x1="12" y1="15" x2="12" y2="3" />
		</svg>
	),
	Copy: () => (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
			<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
			<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
		</svg>
	),
};

export default function CaseTimelineModal({
	caseItem,
	userRole = "cms",
	role = userRole,
	currentUser,
	onRefresh,
	onClose,
	onDeleteCase,
}) {
	useBodyScrollLock(Boolean(caseItem));
	const [chatText, setChatText] = useState("");
	const [pendingFiles, setPendingFiles] = useState([]);
	const [isSending, setIsSending] = useState(false);
	const [isActing, setIsActing] = useState(false);

	// Inline editing state (text + files)
	const [editingPhase, setEditingPhase] = useState(null); // 'initial' | 'review1' | 'review2' | null
	const [editText, setEditText] = useState("");
	const [editFiles, setEditFiles] = useState([]);
	const [isSavingEdit, setIsSavingEdit] = useState(false);
	const editFileInputRef = useRef(null);
	const replaceFileIndexRef = useRef(null);
	const editFormRef = useRef(null);

	// Page-by-page Phase navigation: 'assign' | 'review1' | 'review2' | 'complete'
	const [activePage, setActivePage] = useState(() => {
		if (caseItem.status === "Completed") return "complete";
		if (caseItem.reviewPhase === "review2" || (caseItem.chats || []).some((c) => c.phase === "review2")) return "review2";
		if (caseItem.smsNotes || (caseItem.selectedDocuments && caseItem.selectedDocuments.length > 0) || (caseItem.chats && caseItem.chats.length > 0)) return "review1";
		return "assign";
	});

	// Document table toggle (collapsed by default since table is inside Case Assign phase)
	const [showDocTable, setShowDocTable] = useState(false);
	const [showAllDocs, setShowAllDocs] = useState(false);

	// Notification toast state for edits and updates
	const [notification, setNotification] = useState(null);
	const notifTimeoutRef = useRef(null);
	const [copiedPrompt, setCopiedPrompt] = useState(false);
	const prevCaseRef = useRef(caseItem);

	const showNotification = (text, type = "success") => {
		if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
		setNotification({ text, type });
		notifTimeoutRef.current = setTimeout(() => {
			setNotification(null);
		}, 3500);
	};

	useEffect(() => {
		return () => {
			if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
		};
	}, []);

	// Scroll edit form into view without triggering outer page scroll
	useEffect(() => {
		if (editingPhase && editFormRef.current) {
			setTimeout(() => {
				editFormRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
			}, 50);
		}
	}, [editingPhase]);

	// Detect edits from remote/other party and show notifications
	useEffect(() => {
		const prev = prevCaseRef.current;
		if (prev && prev.id === caseItem?.id) {
			if (prev.smsNotes !== undefined && prev.smsNotes !== caseItem.smsNotes) {
				showNotification("SME Prompt was updated", "info");
			}
			const prevChats = prev.chats || [];
			const currChats = caseItem.chats || [];
			if (prevChats.length === currChats.length && prevChats.length > 0) {
				const hasEditedChat = currChats.some((cc, idx) => {
					const pc = prevChats[idx];
					if (!pc) return false;
					const textChanged = pc.text !== cc.text;
					const editedChanged = pc.editedAt !== cc.editedAt;
					const docsChanged =
						JSON.stringify(pc.documents || []) !==
						JSON.stringify(cc.documents || []);
					return textChanged || editedChanged || docsChanged;
				});
				if (hasEditedChat) {
					showNotification("A review message or attachment was edited", "info");
				}
			}
			if (prev.caseBrief !== undefined && prev.caseBrief !== caseItem.caseBrief) {
				showNotification("Case Brief was updated", "info");
			}
		}
		prevCaseRef.current = caseItem;
	}, [caseItem]);

	const chatEndRef = useRef(null);
	const fileInputRef = useRef(null);

	useEffect(() => {
		if (chatEndRef.current) {
			chatEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
		if (caseItem?.id && role === "cms") {
			api.markCaseRead(caseItem.id).catch(() => {});
		}
	}, [caseItem?.id, caseItem?.chats?.length, caseItem?.reviewPhase, role]);

	if (!caseItem) return null;

	const handleCopySmePrompt = () => {
		if (!caseItem?.smsNotes) return;
		if (navigator?.clipboard?.writeText) {
			navigator.clipboard.writeText(caseItem.smsNotes);
		} else {
			const ta = document.createElement("textarea");
			ta.value = caseItem.smsNotes;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand("copy");
			document.body.removeChild(ta);
		}
		setCopiedPrompt(true);
		showNotification("SME Prompt copied to clipboard!", "success");
		setTimeout(() => setCopiedPrompt(false), 2000);
	};

	const handleOpenDocument = (e, url) => {
		e.preventDefault();
		if (!url || url === "#") return;
		let fullUrl = url;
		if (url.startsWith("/")) {
			const base = getApiBase().replace(/\/api\/?$/, "");
			fullUrl = `${base}${url}`;
		}
		fetch(fullUrl)
			.then((res) => res.blob())
			.then((blob) => {
				const blobUrl = URL.createObjectURL(blob);
				window.open(blobUrl, "_blank");
			})
			.catch((err) => {
				console.error("Error opening document:", err);
				window.open(fullUrl, "_blank");
			});
	};

	const handleDownloadDocument = async (e, url, filename) => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		if (!url || url === "#") return;
		let fullUrl = url;
		if (url.startsWith("/")) {
			const base = getApiBase().replace(/\/api\/?$/, "");
			fullUrl = `${base}${url}`;
		}
		try {
			const res = await fetch(fullUrl);
			const blob = await res.blob();
			const blobUrl = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = blobUrl;
			a.download = filename || url.split("/").pop() || "document";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
		} catch (err) {
			console.error("Error downloading document:", err);
			window.open(fullUrl, "_blank");
		}
	};

	const renderDocPill = (d, i, isMe) => {
		return (
			<div
				key={d.url || d.name || i}
				style={{
					display: "inline-flex",
					flexDirection: "column",
					alignItems: "stretch",
					background: "#ffffff",
					border: "1px solid #e5e7eb",
					borderRadius: "6px",
					overflow: "hidden",
					minWidth: "200px",
					maxWidth: "280px",
				}}
			>
				{/* Top Section: File info */}
				<a
					onClick={(e) => handleOpenDocument(e, d.url)}
					href={d.url || "#"}
					style={{
						padding: "0.45rem 0.7rem",
						color: "#374151",
						textDecoration: "none",
						display: "flex",
						alignItems: "center",
						gap: "0.4rem",
						cursor: "pointer",
					}}
					title="Click to view document in new tab"
				>
					<Icons.File />
					<div style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
						<span
							style={{
								fontSize: "0.8rem",
								fontWeight: 500,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
								color: "#111827",
							}}
							title={d.name}
						>
							{d.name}
						</span>
						{d.size && (
							<span style={{ fontSize: "0.68rem", color: "#9ca3af", lineHeight: 1.2, marginTop: "1px" }}>
								{d.size}
							</span>
						)}
					</div>
				</a>

				{/* Bottom Section: Download button */}
				<button
					type="button"
					onClick={(e) => handleDownloadDocument(e, d.url, d.name)}
					style={{
						width: "100%",
						background: "#f9fafb",
						border: "none",
						borderTop: "1px solid #e5e7eb",
						color: "#6b7280",
						padding: "0.35rem 0.7rem",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "0.35rem",
						fontSize: "0.75rem",
						fontWeight: 500,
						transition: "background 0.15s ease",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = "#f3f4f6";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = "#f9fafb";
					}}
					title="Download document"
				>
					<Icons.Download />
					<span>Download</span>
				</button>
			</div>
		);
	};

	const formatDate = (dateString) => {
		if (!dateString) return "";
		const d = new Date(dateString);
		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const year = d.getFullYear();
		let hours = d.getHours();
		const minutes = String(d.getMinutes()).padStart(2, "0");
		const ampm = hours >= 12 ? "pm" : "am";
		hours = hours % 12 || 12;
		return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
	};

	const getFileExt = (filename) => {
		if (!filename) return "FILE";
		const parts = filename.split(".");
		return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
	};

	const getExtStyle = (ext) => {
		const upper = ext.toUpperCase();
		if (upper === "PDF") {
			return { bg: "rgba(220, 53, 69, 0.08)", color: "#dc3545", border: "1px solid rgba(220, 53, 69, 0.25)" };
		}
		if (upper === "DOC" || upper === "DOCX") {
			return { bg: "rgba(13, 110, 253, 0.08)", color: "#0d6efd", border: "1px solid rgba(13, 110, 253, 0.25)" };
		}
		if (["JPG", "JPEG", "PNG", "WEBP"].includes(upper)) {
			return { bg: "rgba(25, 135, 84, 0.08)", color: "#198754", border: "1px solid rgba(25, 135, 84, 0.25)" };
		}
		return { bg: "rgba(108, 117, 125, 0.08)", color: "#495057", border: "1px solid rgba(108, 117, 125, 0.25)" };
	};

	// Categorize review messages into Review 1 and Review 2
	const categorizeReviewChats = (chats = []) => {
		const r1Chats = chats.filter((c) => c.phase === "review1" && c.sender !== "system");
		const r2Chats = chats.filter((c) => c.phase === "review2" && c.sender !== "system");

		let r1Cms = null;
		let r1Sms = null;
		let r2Cms = null;
		let r2Sms = null;

		if (r1Chats.length > 0 || r2Chats.length > 0) {
			r1Cms = r1Chats.find((c) => c.sender === "cms") || null;
			r1Sms = r1Chats.find((c) => c.sender === "sms") || null;
			r2Cms = r2Chats.find((c) => c.sender === "cms") || null;
			r2Sms = r2Chats.find((c) => c.sender === "sms") || null;
		} else {
			const nonSystem = chats.filter((c) => c.sender !== "system");
			const cmsChats = nonSystem.filter((c) => c.sender === "cms");
			const smsChats = nonSystem.filter((c) => c.sender === "sms");
			r1Cms = cmsChats[0] || null;
			r1Sms = smsChats[0] || null;
			r2Cms = cmsChats[1] || null;
			r2Sms = smsChats[1] || null;
		}

		return { r1Cms, r1Sms, r2Cms, r2Sms };
	};

	const { r1Cms, r1Sms, r2Cms, r2Sms } = categorizeReviewChats(caseItem.chats || []);

	const isCaseCompleted = caseItem.status === "Completed";
	const isChatActive =
		caseItem.status === "Approved" ||
		caseItem.status === "AI Output Submitted" ||
		caseItem.status === "Completed";

	// Phase state tracking
	const isAssignPhaseDone = Boolean(caseItem.smsNotes || caseItem.selectedDocuments?.length > 0 || caseItem.status === "Approved" || isCaseCompleted);
	const isReview1Complete = Boolean(r1Cms && r1Sms);
	const isReview2Started = caseItem.reviewPhase === "review2" || Boolean(r2Cms || r2Sms);
	const isReview2Complete = Boolean(r2Cms && r2Sms);

	const currentActivePhase = isReview2Started ? "review2" : "review1";

	let currentTurn = null;
	if (!isReview1Complete) {
		currentTurn = !r1Cms ? "cms" : "sms";
	} else if (!isReview2Started) {
		currentTurn = "decision";
	} else if (!isReview2Complete) {
		currentTurn = !r2Cms ? "cms" : "sms";
	} else {
		currentTurn = "concluded";
	}

	const isMyTurn = !isCaseCompleted && currentTurn === role;

	// Progress tracker calculation across 4 sequential phases:
	// 1. Case Assign -> 2. Review 1 -> 3. Review 2 (Opt) -> 4. Complete Analysis
	let progressPercent = 25;
	let progressLabel = "Case Assign (Document Reconciliation)";
	if (isCaseCompleted) {
		progressPercent = 100;
		progressLabel = "Case Analysis Completed";
	} else if (isReview2Complete) {
		progressPercent = 90;
		progressLabel = "Review 2 Concluded";
	} else if (isReview2Started) {
		progressPercent = r2Cms ? 85 : 75;
		progressLabel = r2Cms ? "Review 2 Specialist Review" : "Review 2 Client Submission";
	} else if (isReview1Complete) {
		progressPercent = 75;
		progressLabel = "Review 1 Concluded";
	} else if (r1Cms) {
		progressPercent = 55;
		progressLabel = "Review 1 Specialist Review";
	} else if (isAssignPhaseDone) {
		progressPercent = 40;
		progressLabel = "Review 1 Underway";
	}

	// Document aggregation
	const getAllDocuments = () => {
		const all = [];
		const seenUrls = new Set();

		const addDoc = (d, stage, badge, badgeColor) => {
			if (!d || !d.name) return;
			const key = d.url || d.name;
			if (seenUrls.has(key)) return;
			seenUrls.add(key);
			all.push({
				...d,
				stage,
				badge,
				badgeColor,
			});
		};

		(caseItem.documents || []).forEach((d) => {
			const isVerified = (caseItem.selectedDocuments || []).some(
				(sd) => sd.url === d.url || sd.name === d.name,
			);
			addDoc(
				d,
				"Case Assign",
				isVerified ? "✓ Verified" : "Initial",
				isVerified ? "#198754" : "#495057",
			);
		});

		(caseItem.selectedDocuments || []).forEach((sd) => {
			addDoc(sd, "Verified Evidence", "✓ Verified", "#198754");
		});

		(r1Cms?.documents || []).forEach((d) => {
			addDoc(d, "Review 1 (CMS)", "Review 1", "#0d6efd");
		});
		(r1Sms?.documents || []).forEach((d) => {
			addDoc(d, "Review 1 (SMS)", "Specialist R1", "#198754");
		});
		(r2Cms?.documents || []).forEach((d) => {
			addDoc(d, "Review 2 (CMS)", "Review 2", "#495057");
		});
		(r2Sms?.documents || []).forEach((d) => {
			addDoc(d, "Review 2 (SMS)", "Specialist R2", "#198754");
		});

		(caseItem.chats || []).forEach((c) => {
			if (Array.isArray(c.documents)) {
				c.documents.forEach((d) => {
					addDoc(
						d,
						c.phase === "review2" ? "Review 2" : "Review 1",
						c.sender === "sms" ? "Specialist" : "Client",
						c.sender === "sms" ? "#198754" : "#0d6efd",
					);
				});
			}
		});

		return all;
	};

	const allDocs = getAllDocuments();

	// Breakdown for Document Reconciliation in Case Assign
	const clientUploadedDocs = caseItem.documents || [];
	const verifiedDocs = caseItem.selectedDocuments || [];
	const excludedDocs = clientUploadedDocs.filter(
		(d) => !verifiedDocs.some((vd) => (vd.url && vd.url === d.url) || vd.name === d.name),
	);

	const handleFileUpload = (e) => {
		const files = Array.from(e.target.files || []);
		if (!files.length) return;

		for (const file of files) {
			if (file.size > 100 * 1024 * 1024) {
				alert(`File "${file.name}" exceeds 100MB.`);
				continue;
			}
			const reader = new FileReader();
			reader.onload = (event) => {
				const base64Url = event.target.result;
				const sizeMb = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
				setPendingFiles((prev) => [
					...prev,
					{ name: file.name, size: sizeMb, url: base64Url },
				]);
			};
			reader.readAsDataURL(file);
		}
		e.target.value = null;
	};

	const handleRemoveFile = (index) => {
		setPendingFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSendReview = async () => {
		if (!chatText.trim() && pendingFiles.length === 0) return;

		setIsSending(true);
		try {
			const targetPhase = activePage === "review2" ? "review2" : "review1";
			await api.addChatMessage(
				caseItem.id,
				role,
				chatText.trim(),
				pendingFiles,
				targetPhase,
			);
			setChatText("");
			setPendingFiles([]);
			if (onRefresh) onRefresh();
		} catch (err) {
			alert(`Error sending message: ${err.message}`);
		} finally {
			setIsSending(false);
		}
	};

	// Start editing a sent message (text + files)
	const handleStartEdit = (phase, currentText, currentFiles = []) => {
		setEditingPhase(phase);
		setEditText(currentText || "");
		setEditFiles(Array.isArray(currentFiles) ? [...currentFiles] : []);
		replaceFileIndexRef.current = null;
	};

	const handleCancelEdit = () => {
		setEditingPhase(null);
		setEditText("");
		setEditFiles([]);
		replaceFileIndexRef.current = null;
	};

	const handleEditFileUpload = (e) => {
		const files = Array.from(e.target.files || []);
		if (!files.length) return;

		for (let idx = 0; idx < files.length; idx++) {
			const file = files[idx];
			if (file.size > 100 * 1024 * 1024) {
				alert(`File "${file.name}" exceeds 100MB.`);
				continue;
			}
			const reader = new FileReader();
			const fileIdx = idx;
			reader.onload = (event) => {
				const base64Url = event.target.result;
				const sizeMb = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
				const newDoc = { name: file.name, size: sizeMb, url: base64Url };

				setEditFiles((prev) => {
					if (
						replaceFileIndexRef.current !== null &&
						replaceFileIndexRef.current >= 0 &&
						replaceFileIndexRef.current < prev.length &&
						fileIdx === 0
					) {
						const targetIdx = replaceFileIndexRef.current;
						replaceFileIndexRef.current = null;
						const updated = [...prev];
						updated[targetIdx] = newDoc;
						return updated;
					}
					return [...prev, newDoc];
				});
			};
			reader.readAsDataURL(file);
		}
		e.target.value = null;
	};

	const handleRemoveEditFile = (index) => {
		setEditFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleTriggerReplaceFile = (index) => {
		replaceFileIndexRef.current = index;
		if (editFileInputRef.current) {
			editFileInputRef.current.click();
		}
	};

	const handleTriggerAddFile = () => {
		replaceFileIndexRef.current = null;
		if (editFileInputRef.current) {
			editFileInputRef.current.click();
		}
	};

	const handleSaveEdit = async (phase) => {
		if (phase === "initial") {
			if (!editText.trim()) {
				alert("Case brief text cannot be empty.");
				return;
			}
		} else if (!editText.trim() && editFiles.length === 0) {
			alert("Message text or at least one file attachment is required.");
			return;
		}

		setIsSavingEdit(true);
		try {
			await api.editChatMessage(
				caseItem.id,
				phase,
				role,
				editText.trim(),
				phase === "initial" ? undefined : editFiles,
			);
			setEditingPhase(null);
			setEditText("");
			setEditFiles([]);
			replaceFileIndexRef.current = null;
			showNotification("Message and attachments updated successfully", "success");
			if (onRefresh) onRefresh();
		} catch (err) {
			alert(`Error updating message: ${err.message}`);
		} finally {
			setIsSavingEdit(false);
		}
	};

	const renderEditForm = (phase, isDarkBubble = false) => {
		return (
			<div
				ref={editFormRef}
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "0.75rem",
					marginTop: "0.4rem",
					background: isDarkBubble ? "rgba(0,0,0,0.22)" : "#f8fafc",
					border: isDarkBubble ? "1px solid rgba(255,255,255,0.18)" : "1px solid #cbd5e1",
					borderRadius: "8px",
					padding: "0.95rem 1.15rem",
					width: "100%",
					minWidth: "min(100%, 750px)",
					boxSizing: "border-box",
				}}
			>
				<textarea
					value={editText}
					onChange={(e) => setEditText(e.target.value)}
					placeholder="Edit message text..."
					style={{
						width: "100%",
						padding: "0.75rem 0.95rem",
						borderRadius: "6px",
						border: isDarkBubble ? "1px solid #475569" : "1px solid #cbd5e1",
						background: isDarkBubble ? "#1e293b" : "#ffffff",
						color: isDarkBubble ? "#ffffff" : "#0f172a",
						fontSize: "0.95rem",
						lineHeight: 1.6,
						fontFamily: "inherit",
						resize: "vertical",
						minHeight: "75px",
						maxHeight: "140px",
						outline: "none",
						boxSizing: "border-box",
					}}
				/>

				{/* Attached files management in edit mode */}
				<div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
						<span style={{ fontSize: "0.72rem", color: isDarkBubble ? "#cbd5e1" : "#475569", fontWeight: 600 }}>
							Attached Files ({editFiles.length})
						</span>
						<button
							type="button"
							onClick={handleTriggerAddFile}
							style={{
								background: isDarkBubble ? "rgba(255,255,255,0.18)" : "#e2e8f0",
								border: "none",
								color: isDarkBubble ? "#ffffff" : "#0f172a",
								padding: "3px 9px",
								borderRadius: "4px",
								fontSize: "0.72rem",
								fontWeight: 600,
								cursor: "pointer",
								display: "inline-flex",
								alignItems: "center",
								gap: "0.3rem",
							}}
							title="Add another file"
						>
							<Icons.Paperclip />
							<span>+ Add File</span>
						</button>
					</div>

					{editFiles.length > 0 ? (
						<div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "2px" }}>
							{editFiles.map((f, fi) => (
								<div
									key={`${f.name}-${fi}`}
									style={{
										display: "inline-flex",
										alignItems: "center",
										gap: "0.35rem",
										background: isDarkBubble ? "rgba(255,255,255,0.14)" : "#ffffff",
										border: isDarkBubble ? "1px solid rgba(255,255,255,0.25)" : "1px solid #cbd5e1",
										padding: "0.22rem 0.5rem",
										borderRadius: "4px",
										fontSize: "0.72rem",
										color: isDarkBubble ? "#ffffff" : "#0f172a",
									}}
								>
									<Icons.File />
									<span
										style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
										title={f.name}
									>
										{f.name} {f.size ? `(${f.size})` : ""}
									</span>
									<button
										type="button"
										onClick={() => handleTriggerReplaceFile(fi)}
										style={{
											background: isDarkBubble ? "rgba(255,255,255,0.22)" : "#f1f5f9",
											border: "none",
											color: isDarkBubble ? "#60a5fa" : "#0284c7",
											padding: "2px 6px",
											borderRadius: "3px",
											fontSize: "0.68rem",
											fontWeight: 600,
											cursor: "pointer",
										}}
										title="Replace this file with another file"
									>
										Replace
									</button>
									<button
										type="button"
										onClick={() => handleRemoveEditFile(fi)}
										style={{
											background: "none",
											border: "none",
											color: "#ef4444",
											padding: "0 2px",
											fontSize: "0.85rem",
											lineHeight: 1,
											cursor: "pointer",
											fontWeight: 700,
										}}
										title="Remove this file"
									>
										✕
									</button>
								</div>
							))}
						</div>
					) : (
						<span style={{ fontSize: "0.7rem", color: isDarkBubble ? "#94a3b8" : "#94a3b8", fontStyle: "italic" }}>
							No files attached. Use "+ Add File" to attach documents.
						</span>
					)}
				</div>

				{/* Form action buttons */}
				<div style={{ display: "flex", gap: "0.45rem", justifyContent: "flex-end", marginTop: "0.2rem" }}>
					<button
						type="button"
						onClick={handleCancelEdit}
						disabled={isSavingEdit}
						style={{
							background: isDarkBubble ? "rgba(255,255,255,0.14)" : "#f1f5f9",
							border: isDarkBubble ? "none" : "1px solid #cbd5e1",
							color: isDarkBubble ? "#f8fafc" : "#475569",
							borderRadius: "4px",
							padding: "4px 10px",
							fontSize: "0.74rem",
							fontWeight: 500,
							cursor: "pointer",
						}}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => handleSaveEdit(phase)}
						disabled={isSavingEdit}
						style={{
							background: "#059669",
							border: "none",
							color: "#ffffff",
							borderRadius: "4px",
							padding: "4px 12px",
							fontSize: "0.74rem",
							fontWeight: 600,
							cursor: "pointer",
							display: "inline-flex",
							alignItems: "center",
							gap: "0.3rem",
							boxShadow: "0 1px 3px rgba(5, 150, 105, 0.25)",
						}}
					>
						<Icons.Check />
						<span>{isSavingEdit ? "Saving..." : "Save Changes"}</span>
					</button>
				</div>
			</div>
		);
	};

	const handleProceedToReview2 = async () => {
		setIsActing(true);
		try {
			await api.handleReviewAction(
				caseItem.id,
				"proceed_review2",
				role,
				"Proceeded to Review 2",
			);
			setActivePage("review2");
			if (onRefresh) onRefresh();
		} catch (err) {
			alert(`Error: ${err.message}`);
		} finally {
			setIsActing(false);
		}
	};



	const renderInputBar = (placeholderText) => {
		if (isCaseCompleted) {
			return (
				<div
					style={{
						textAlign: "center",
						fontSize: "0.78rem",
						color: "#059669",
						fontWeight: 500,
						padding: "0.35rem 0",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "0.35rem",
					}}
				>
					<Icons.Check /> Case analysis is completed. Communication history is closed.
				</div>
			);
		}

		if (!isChatActive) {
			return (
				<div
					style={{
						textAlign: "center",
						fontSize: "0.78rem",
						color: "#64748b",
						padding: "0.35rem 0",
					}}
				>
					Case is not open for active review messaging.
				</div>
			);
		}

		if (isMyTurn) {
			return (
				<div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
					{/* Pending files list */}
					{pendingFiles.length > 0 && (
						<div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
							{pendingFiles.map((f, i) => (
								<div
									key={`${f.name}-${f.size}-${i}`}
									style={{
										display: "inline-flex",
										alignItems: "center",
										gap: "0.35rem",
										background: "#f1f5f9",
										border: "1px solid #e2e8f0",
										padding: "0.2rem 0.5rem",
										borderRadius: "4px",
										fontSize: "0.72rem",
										color: "#0f172a",
									}}
								>
									<Icons.File />
									<span>{f.name}</span>
									<button
										type="button"
										onClick={() => handleRemoveFile(i)}
										style={{
											background: "none",
											border: "none",
											color: "#dc2626",
											cursor: "pointer",
											fontSize: "0.9rem",
											lineHeight: 1,
											display: "inline-flex",
											padding: 0,
											marginLeft: "2px",
										}}
										title="Remove file"
									>
										&times;
									</button>
								</div>
							))}
						</div>
					)}

					<div style={{ display: "flex", gap: "0.45rem", alignItems: "flex-end" }}>
						<input
							type="file"
							ref={fileInputRef}
							style={{ display: "none" }}
							multiple
							onChange={handleFileUpload}
						/>
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							style={{
								background: "#f8fafc",
								border: "1px solid #cbd5e1",
								borderRadius: "6px",
								width: "44px",
								height: "44px",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "#475569",
								transition: "all 0.15s ease",
								flexShrink: 0,
							}}
							title="Attach document / file"
							onMouseEnter={(e) => {
								e.currentTarget.style.background = "#e2e8f0";
								e.currentTarget.style.color = "#0f172a";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = "#f8fafc";
								e.currentTarget.style.color = "#475569";
							}}
						>
							<Icons.Paperclip />
						</button>

						<textarea
							value={chatText}
							onChange={(e) => setChatText(e.target.value)}
							placeholder={placeholderText}
							style={{
								flex: 1,
								padding: "0.7rem 0.95rem",
								border: "1px solid #cbd5e1",
								borderRadius: "6px",
								resize: "vertical",
								outline: "none",
								fontSize: "0.92rem",
								fontFamily: "inherit",
								minHeight: "56px",
								maxHeight: "130px",
								background: "#ffffff",
								color: "#0f172a",
								lineHeight: 1.5,
							}}
							onFocus={(e) => {
								e.target.style.border = "1.5px solid #10b981";
								e.target.style.boxShadow = "0 0 0 2px rgba(16, 185, 129, 0.12)";
							}}
							onBlur={(e) => {
								e.target.style.border = "1px solid #cbd5e1";
								e.target.style.boxShadow = "none";
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									handleSendReview();
								}
							}}
						/>

						<button
							type="button"
							onClick={handleSendReview}
							disabled={isSending || (!chatText.trim() && pendingFiles.length === 0)}
							style={{
								background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
								color: "#ffffff",
								border: "none",
								borderRadius: "6px",
								padding: "0 1.5rem",
								height: "44px",
								fontWeight: 600,
								fontSize: "0.88rem",
								cursor:
									isSending || (!chatText.trim() && pendingFiles.length === 0)
										? "not-allowed"
										: "pointer",
								opacity:
									isSending || (!chatText.trim() && pendingFiles.length === 0)
										? 0.4
										: 1,
								flexShrink: 0,
								display: "inline-flex",
								alignItems: "center",
								gap: "0.4rem",
								transition: "background 0.15s ease",
							}}
						>
							<span>{isSending ? "Sending..." : "Send"}</span>
							{!isSending && <Icons.Send />}
						</button>
					</div>
				</div>
			);
		}

		return (
			<div
				style={{
					textAlign: "center",
					fontSize: "0.78rem",
					color: "#64748b",
					padding: "0.45rem 0",
					background: "#f8fafc",
					border: "1px dashed #cbd5e1",
					borderRadius: "4px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: "0.4rem",
				}}
			>
				<Icons.Clock />
				<span>Waiting for specialist review response...</span>
			</div>
		);
	};

	return (
		<div
			className="modal-backdrop"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose();
			}}
			role="dialog"
			aria-modal="true"
			tabIndex={-1}
			style={{
				zIndex: 1000,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "1rem",
				backgroundColor: "rgba(15, 23, 42, 0.45)",
				backdropFilter: "blur(6px)",
				overscrollBehavior: "contain",
				fontFamily: '"Inter", "Segoe UI", "Roboto", -apple-system, sans-serif',
			}}
		>
			<div
				className="modal-window"
				style={{
					position: "relative",
					maxWidth: "1380px",
					width: "98vw",
					height: "95vh",
					maxHeight: "960px",
					padding: "0",
					borderRadius: "8px",
					boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.12), 0 10px 15px -5px rgba(0, 0, 0, 0.05)",
					overflow: "hidden",
					background: "#ffffff",
					border: "1px solid #e2e8f0",
					display: "flex",
					flexDirection: "column",
				}}
			>
				{/* Floating Notification Toast */}
				{notification && (
					<div
						style={{
							position: "absolute",
							top: "14px",
							left: "50%",
							transform: "translateX(-50%)",
							zIndex: 1100,
							background:
								notification.type === "error"
									? "#fee2e2"
									: notification.type === "info"
										? "#eff6ff"
										: "#ecfdf5",
							color:
								notification.type === "error"
									? "#991b1b"
									: notification.type === "info"
										? "#1d4ed8"
										: "#065f46",
							border:
								notification.type === "error"
									? "1px solid #f87171"
									: notification.type === "info"
										? "1px solid #93c5fd"
										: "1px solid #6ee7b7",
							padding: "0.45rem 1.1rem",
							borderRadius: "6px",
							fontSize: "0.82rem",
							fontWeight: 600,
							boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
							display: "inline-flex",
							alignItems: "center",
							gap: "0.45rem",
							pointerEvents: "none",
						}}
					>
						<span>{notification.type === "error" ? "⚠️" : notification.type === "info" ? "ℹ️" : "✓"}</span>
						<span>{notification.text}</span>
					</div>
				)}

				{/* Top Header - CMS Soft Dark Topbar */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						background: "#0f172a",
						color: "#ffffff",
						padding: "0.85rem 1.4rem",
						borderBottom: "1px solid #1e293b",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.85rem",
							minWidth: 0,
						}}
					>
						<div
							style={{
								width: "38px",
								height: "38px",
								borderRadius: "50%",
								background: "#1e293b",
								border: "1px solid #334155",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontWeight: 700,
								fontSize: "0.9rem",
								color: "#f8f9fa",
								flexShrink: 0,
								overflow: "hidden",
							}}
						>
							{caseItem.reviewerInfo?.profileImage ? (
								<img
									src={caseItem.reviewerInfo.profileImage}
									alt="SMS"
									style={{ width: "100%", height: "100%", objectFit: "cover" }}
								/>
							) : (
								<Icons.User />
							)}
						</div>
						<div style={{ minWidth: 0 }}>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.55rem",
								}}
							>
								<h2
									style={{
										fontSize: "0.98rem",
										margin: 0,
										fontWeight: 600,
										color: "#ffffff",
										letterSpacing: "-0.01em",
									}}
								>
									{caseItem.reviewerInfo?.name || "SMS Specialist Review Desk"}
								</h2>
								<span
									style={{
										fontSize: "0.68rem",
										fontWeight: 600,
										padding: "2px 8px",
										borderRadius: "4px",
										color:
											caseItem.status === "Completed"
												? "#34d399"
												: caseItem.status === "Approved"
													? "#fbbf24"
													: "#94a3b8",
										background:
											caseItem.status === "Completed"
												? "rgba(16, 185, 129, 0.15)"
												: caseItem.status === "Approved"
													? "rgba(245, 158, 11, 0.15)"
													: "rgba(148, 163, 184, 0.15)",
										border:
											caseItem.status === "Completed"
												? "1px solid rgba(16, 185, 129, 0.3)"
												: caseItem.status === "Approved"
													? "1px solid rgba(245, 158, 11, 0.3)"
													: "1px solid rgba(148, 163, 184, 0.25)",
									}}
								>
									{caseItem.status === "Approved"
										? "UNDER REVIEW"
										: caseItem.status.toUpperCase()}
								</span>
							</div>
							<div
								style={{
									fontSize: "0.75rem",
									color: "#94a3b8",
									marginTop: "2px",
								}}
							>
								Case: <strong style={{ color: "#ffffff" }}>{caseItem.id}</strong> | Client:{" "}
								{currentUser?.clientId || caseItem.clientId || "N/A"} (
								{caseItem.title ? `${caseItem.title} ` : ""}
								{caseItem.clientName})
							</div>
						</div>
					</div>

					<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
						{onDeleteCase && (
							<button
								type="button"
								onClick={() => onDeleteCase(caseItem)}
								style={{
									background: "rgba(239, 68, 68, 0.15)",
									border: "1px solid rgba(239, 68, 68, 0.4)",
									color: "#fca5a5",
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									gap: "0.35rem",
									padding: "0.45rem 0.85rem",
									borderRadius: "6px",
									fontSize: "0.82rem",
									fontWeight: 600,
									transition: "all 0.15s ease",
								}}
								title="Delete this case"
								onMouseEnter={(e) => {
									e.currentTarget.style.background = "#ef4444";
									e.currentTarget.style.color = "#ffffff";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
									e.currentTarget.style.color = "#fca5a5";
								}}
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<polyline points="3 6 5 6 21 6"></polyline>
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
									<line x1="10" y1="11" x2="10" y2="17"></line>
									<line x1="14" y1="11" x2="14" y2="17"></line>
								</svg>
								<span>Delete Case</span>
							</button>
						)}

						<button
							type="button"
							onClick={onClose}
							style={{
								background: "rgba(255, 255, 255, 0.08)",
								border: "1px solid rgba(255, 255, 255, 0.18)",
								color: "#cbd5e1",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "0.35rem",
								padding: "0.45rem 0.95rem",
								borderRadius: "6px",
								fontSize: "0.82rem",
								fontWeight: 600,
								transition: "all 0.15s ease",
							}}
							title="Exit / Close Case Analysis (Esc)"
							onMouseEnter={(e) => {
								e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)";
								e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
								e.currentTarget.style.color = "#ffffff";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
								e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
								e.currentTarget.style.color = "#cbd5e1";
							}}
						>
							<Icons.Close />
							<span>Exit</span>
						</button>
					</div>
				</div>

				{/* 4-Phase Stepper Top Bar: 1. Case Assign -> 2. Review 1 -> 3. Review 2 (Opt) -> 4. Complete Analysis */}
				<div
					style={{
						background: "#f8fafc",
						borderBottom: "1px solid #e2e8f0",
						padding: "0.7rem 1.4rem",
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "0.45rem",
							fontSize: "0.75rem",
						}}
					>
						<span style={{ fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.72rem" }}>
							Case Analysis Process
						</span>
						<span
							style={{
								fontWeight: 600,
								color: isCaseCompleted ? "#059669" : "#0f172a",
								background: isCaseCompleted ? "#ecfdf5" : "#f1f5f9",
								border: isCaseCompleted ? "1px solid #a7f3d0" : "1px solid #cbd5e1",
								padding: "1px 8px",
								borderRadius: "4px",
								fontSize: "0.72rem",
							}}
						>
							{progressLabel} • {progressPercent}%
						</span>
					</div>

					{/* Visual Progress Bar Track */}
					<div
						style={{
							width: "100%",
							height: "6px",
							background: "#e2e8f0",
							borderRadius: "999px",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								width: `${progressPercent}%`,
								height: "100%",
								background: isCaseCompleted
									? "#059669"
									: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
								borderRadius: "999px",
								transition: "width 0.4s ease",
							}}
						/>
					</div>

					{/* 4 Milestone Stepper - Page by Page Tabs */}
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(4, 1fr)",
							gap: "0.45rem",
							marginTop: "0.55rem",
						}}
					>
						{[
							{ id: "assign", num: 1, label: "1. Assign", done: isAssignPhaseDone },
							{ id: "review1", num: 2, label: "2. Review 1", done: isReview1Complete },
							{ id: "review2", num: 3, label: "3. Review 2", done: isReview2Complete },
							{ id: "complete", num: 4, label: "4. Complete", done: isCaseCompleted },
						].map((tab) => {
							const isActive = activePage === tab.id;
							return (
								<button
									key={tab.id}
									type="button"
									onClick={() => setActivePage(tab.id)}
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										gap: "0.45rem",
										padding: "0.48rem 0.65rem",
										borderRadius: "6px",
										border: isActive
											? "1.5px solid #059669"
											: tab.done
												? "1px solid #a7f3d0"
												: "1px solid #e2e8f0",
										background: isActive
											? "#059669"
											: tab.done
												? "#f0fdf4"
												: "#ffffff",
										color: isActive
											? "#ffffff"
											: tab.done
												? "#059669"
												: "#64748b",
										fontSize: "0.78rem",
										fontWeight: isActive || tab.done ? 700 : 500,
										cursor: "pointer",
										transition: "all 0.15s ease",
										boxShadow: isActive ? "0 2px 4px rgba(5, 150, 105, 0.2)" : "none",
									}}
								>
									<span
										style={{
											width: "18px",
											height: "18px",
											borderRadius: "50%",
											display: "inline-flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: "0.66rem",
											fontWeight: 700,
											background: isActive
												? "rgba(255,255,255,0.25)"
												: tab.done
													? "#10b981"
													: "#e2e8f0",
											color: isActive
												? "#ffffff"
												: tab.done
													? "#ffffff"
													: "#475569",
											flexShrink: 0,
										}}
									>
										{tab.done ? "✓" : tab.num}
									</span>
									<span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
										{tab.label}
									</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* Main Content Area - Page-by-Page Phase Views (No outer scroll) */}
				<div
					style={{
						padding: "1rem 1.4rem",
						overflow: "hidden",
						flex: 1,
						display: "flex",
						flexDirection: "column",
						background: "#f8fafc",
					}}
				>
					{/* ─── PAGE 1: CASE ASSIGN & DOCUMENT RECONCILIATION ─── */}
					{activePage === "assign" && (
						<div
							style={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
								justifyContent: "space-between",
								gap: "0.55rem",
								overflowY: showAllDocs ? "auto" : "hidden",
								paddingRight: "2px",
							}}
						>
							<div
								style={{
									background: "#ffffff",
									border: "1px solid #e2e8f0",
									borderRadius: "8px",
									padding: "0.75rem 1rem",
									boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
									display: "flex",
									flexDirection: "column",
									gap: "0.55rem",
								}}
							>
						{/* Phase 1 Header */}
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								borderBottom: "1px solid #f1f5f9",
								paddingBottom: "0.55rem",
							}}
						>
							<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
								<span
									style={{
										display: "inline-flex",
										alignItems: "center",
										justifyContent: "center",
										width: "22px",
										height: "22px",
										borderRadius: "50%",
										background: "#059669",
										color: "#ffffff",
										fontSize: "0.72rem",
										fontWeight: 700,
									}}
								>
									1
								</span>
								<span
									style={{
										fontSize: "0.82rem",
										fontWeight: 700,
										color: "#0f172a",
										textTransform: "uppercase",
										letterSpacing: "0.04em",
									}}
								>
									Phase 1: Assignment
								</span>
							</div>
							<span style={{ fontSize: "0.74rem", color: "#64748b" }}>
								Filed: {formatDate(caseItem.createdAt)}
							</span>
						</div>

						{/* 1. Case Brief */}
						<div
							style={{
								background: "#f8fafc",
								border: "1px solid #e2e8f0",
								borderRadius: "6px",
								padding: "0.6rem 0.85rem",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: "0.3rem",
								}}
							>
								<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
									<span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.03em" }}>
										Case Brief
									</span>
									<span style={{ fontSize: "0.68rem", color: "#64748b" }}>
										• ID: {currentUser?.clientId || caseItem.clientId || "N/A"}
									</span>
								</div>
								{role === "cms" && !isCaseCompleted && editingPhase !== "initial" && (
									<button
										type="button"
										onClick={() => handleStartEdit("initial", caseItem.details)}
										style={{
											background: "none",
											border: "none",
											color: "#0d6efd",
											cursor: "pointer",
											fontSize: "0.72rem",
											fontWeight: 600,
											display: "inline-flex",
											alignItems: "center",
											gap: "0.25rem",
										}}
									>
										<Icons.Edit /> Edit
									</button>
								)}
							</div>

							{editingPhase === "initial" ? (
								<div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
									<textarea
										value={editText}
										onChange={(e) => setEditText(e.target.value)}
										style={{
											width: "100%",
											padding: "0.45rem 0.65rem",
											borderRadius: "4px",
											border: "1px solid #cbd5e1",
											background: "#ffffff",
											color: "#0f172a",
											fontSize: "0.82rem",
											fontFamily: "inherit",
											resize: "vertical",
											minHeight: "50px",
											outline: "none",
										}}
									/>
									<div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
										<button
											type="button"
											onClick={handleCancelEdit}
											disabled={isSavingEdit}
											style={{
												background: "#f1f5f9",
												border: "1px solid #cbd5e1",
												color: "#475569",
												borderRadius: "4px",
												padding: "2px 8px",
												fontSize: "0.72rem",
												cursor: "pointer",
											}}
										>
											Cancel
										</button>
										<button
											type="button"
											onClick={() => handleSaveEdit("initial")}
											disabled={isSavingEdit}
											style={{
												background: "#0f172a",
												border: "none",
												color: "#ffffff",
												borderRadius: "4px",
												padding: "2px 8px",
												fontSize: "0.72rem",
												fontWeight: 600,
												cursor: "pointer",
											}}
										>
											{isSavingEdit ? "Saving..." : "Save"}
										</button>
									</div>
								</div>
							) : (
								<div style={{ fontSize: "0.82rem", color: "#1e293b", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
									{caseItem.details}
								</div>
							)}

							{caseItem.summary && (
								<div style={{ marginTop: "0.35rem", paddingTop: "0.35rem", borderTop: "1px dashed #cbd5e1", fontSize: "0.75rem", color: "#64748b", lineHeight: 1.4 }}>
									{caseItem.summary}
								</div>
							)}
						</div>

						{/* 2. Document Table */}
						<div>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: "0.45rem",
									flexWrap: "wrap",
									gap: "0.4rem",
								}}
							>
								<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
									<span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.03em" }}>
										Documents ({clientUploadedDocs.length})
									</span>
								</div>

								{/* Retained vs Excluded Pills */}
								{verifiedDocs.length > 0 && (
									<div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
										<span style={{ fontSize: "0.68rem", padding: "1px 7px", borderRadius: "4px", background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", fontWeight: 600 }}>
											✓ Retained: {verifiedDocs.length}
										</span>
										{excludedDocs.length > 0 && (
											<span style={{ fontSize: "0.68rem", padding: "1px 7px", borderRadius: "4px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", fontWeight: 600 }}>
												⊖ Excluded: {excludedDocs.length}
											</span>
										)}
									</div>
								)}
							</div>

							{/* Document Table */}
							<div
								style={{
									border: "1px solid #e2e8f0",
									borderRadius: "6px",
									overflow: "hidden",
									background: "#ffffff",
								}}
							>
								{clientUploadedDocs.length === 0 ? (
									<div style={{ padding: "0.75rem", textAlign: "center", color: "#94a3b8", fontSize: "0.76rem" }}>
										No documents uploaded for this case.
									</div>
								) : (
									<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem", textAlign: "left" }}>
										<thead>
											<tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "0.71rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
												<th style={{ padding: "0.4rem 0.75rem", width: "40px" }}>#</th>
												<th style={{ padding: "0.4rem 0.75rem" }}>Document Name</th>
												<th style={{ padding: "0.4rem 0.75rem", width: "85px" }}>Size</th>
												<th style={{ padding: "0.4rem 0.75rem", width: "160px" }}>Status</th>
												<th style={{ padding: "0.4rem 0.75rem", width: "80px", textAlign: "right" }}>Action</th>
											</tr>
										</thead>
										<tbody>
											{(showAllDocs ? clientUploadedDocs : clientUploadedDocs.slice(0, 2)).map((doc, idx) => {
												const ext = getFileExt(doc.name);
												const extStyle = getExtStyle(ext);
												const hasSmeSelected = verifiedDocs.length > 0;
												const isSelected = !hasSmeSelected || verifiedDocs.some((vd) => (vd.url && vd.url === doc.url) || vd.name === doc.name);
												const isFaded = hasSmeSelected && !isSelected;

												return (
													<tr
														key={`${doc.name}-${idx}`}
														style={{
															borderBottom: "1px solid #f1f5f9",
															background: isFaded ? "#fafafa" : "#ffffff",
															opacity: isFaded ? 0.38 : 1,
															transition: "all 0.15s ease",
															cursor: isFaded ? "not-allowed" : "default",
														}}
													>
														<td style={{ padding: "0.4rem 0.75rem", color: isFaded ? "#94a3b8" : "#64748b" }}>
															{idx + 1}
														</td>
														<td
															style={{
																padding: "0.4rem 0.75rem",
																fontWeight: 500,
																color: isFaded ? "#94a3b8" : "#0f172a",
															}}
														>
															<span
																style={{
																	fontSize: "0.62rem",
																	padding: "1px 5px",
																	borderRadius: "4px",
																	marginRight: "6px",
																	fontWeight: 700,
																	background: isFaded ? "#f1f5f9" : extStyle.bg,
																	color: isFaded ? "#94a3b8" : extStyle.color,
																	border: isFaded ? "1px solid #e2e8f0" : extStyle.border,
																}}
															>
																{ext}
															</span>
															<span style={{ textDecoration: isFaded ? "line-through" : "none" }}>
																{doc.name}
															</span>
														</td>
														<td style={{ padding: "0.4rem 0.75rem", color: isFaded ? "#94a3b8" : "#64748b" }}>
															{doc.size || "-"}
														</td>
														<td style={{ padding: "0.4rem 0.75rem" }}>
															{hasSmeSelected ? (
																isSelected ? (
																	<span style={{ fontSize: "0.66rem", fontWeight: 600, padding: "2px 7px", borderRadius: "4px", background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
																		✓ Selected
																	</span>
																) : (
																	<span style={{ fontSize: "0.66rem", fontWeight: 600, padding: "2px 7px", borderRadius: "4px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
																		⊖ Excluded
																	</span>
																)
															) : (
																<span style={{ fontSize: "0.66rem", fontWeight: 600, padding: "2px 7px", borderRadius: "4px", background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
																	Pending SME
																</span>
															)}
														</td>
														<td style={{ padding: "0.4rem 0.75rem", textAlign: "right" }}>
															{isFaded ? (
																<span
																	title="Not selected by SME"
																	style={{
																		fontSize: "0.72rem",
																		color: "#94a3b8",
																		fontStyle: "italic",
																		cursor: "not-allowed",
																		userSelect: "none",
																	}}
																>
																	Disabled
																</span>
															) : (
																<div style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "0.55rem" }}>
																	<a
																		onClick={(e) => handleOpenDocument(e, doc.url)}
																		href={doc.url || "#"}
																		style={{
																			fontSize: "0.74rem",
																			color: "#0d6efd",
																			fontWeight: 600,
																			textDecoration: "none",
																			cursor: "pointer",
																			display: "inline-flex",
																			alignItems: "center",
																			gap: "0.2rem",
																		}}
																		title="View document in new tab"
																	>
																		<span>View</span>
																		<Icons.ExternalLink />
																	</a>
																	<button
																		type="button"
																		onClick={(e) => handleDownloadDocument(e, doc.url, doc.name)}
																		style={{
																			background: "#f1f5f9",
																			border: "1px solid #cbd5e1",
																			color: "#0f172a",
																			padding: "2px 7px",
																			borderRadius: "4px",
																			fontSize: "0.72rem",
																			fontWeight: 600,
																			cursor: "pointer",
																			display: "inline-flex",
																			alignItems: "center",
																			gap: "0.25rem",
																			transition: "all 0.15s ease",
																		}}
																		title="Download document"
																	>
																		<Icons.Download />
																		<span>Download</span>
																	</button>
																</div>
															)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								)}
								{clientUploadedDocs.length > 2 && (
									<div
										style={{
											display: "flex",
											justifyContent: "center",
											alignItems: "center",
											padding: "0.35rem 0.6rem",
											background: "#f8fafc",
											borderTop: "1px solid #e2e8f0",
										}}
									>
										<button
											type="button"
											onClick={() => setShowAllDocs(!showAllDocs)}
											style={{
												background: "#ffffff",
												border: "1px solid #cbd5e1",
												borderRadius: "4px",
												padding: "2px 10px",
												fontSize: "0.72rem",
												fontWeight: 600,
												color: "#059669",
												cursor: "pointer",
												display: "inline-flex",
												alignItems: "center",
												gap: "0.3rem",
												transition: "all 0.15s ease",
											}}
										>
											<span>
												{showAllDocs
													? `▲ Show Less (2 of ${clientUploadedDocs.length})`
													: `▼ Show More (${clientUploadedDocs.length - 2} more)`}
											</span>
										</button>
									</div>
								)}
							</div>
						</div>

						{/* 3. SME Prompt: Box (3 lines max with inner scroll) */}
						<div
							style={{
								background: "#f8fafc",
								border: "1.5px solid #10b981",
								borderLeft: "6px solid #059669",
								borderRadius: "6px",
								padding: "0.55rem 0.85rem",
								boxShadow: "0 1px 4px rgba(16, 185, 129, 0.08)",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: "0.35rem",
								}}
							>
								<span
									style={{
										fontSize: "0.82rem",
										fontWeight: 700,
										color: "#065f46",
										textTransform: "uppercase",
										letterSpacing: "0.04em",
										display: "inline-flex",
										alignItems: "center",
										gap: "0.35rem",
									}}
								>
									<Icons.ClipboardCheck /> SME Prompt:
								</span>
								{caseItem.smsNotes && (
									<button
										type="button"
										onClick={handleCopySmePrompt}
										style={{
											background: copiedPrompt ? "#ecfdf5" : "#ffffff",
											border: copiedPrompt ? "1px solid #a7f3d0" : "1px solid #cbd5e1",
											color: copiedPrompt ? "#059669" : "#1e293b",
											padding: "2px 8px",
											borderRadius: "4px",
											fontSize: "0.72rem",
											fontWeight: 600,
											cursor: "pointer",
											display: "inline-flex",
											alignItems: "center",
											gap: "0.3rem",
											transition: "all 0.15s ease",
											boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
										}}
										title="Copy SME prompt to clipboard"
									>
										{copiedPrompt ? <Icons.Check /> : <Icons.Copy />}
										<span>{copiedPrompt ? "Copied!" : "Copy Prompt"}</span>
									</button>
								)}
							</div>

							<div
								style={{
									fontSize: "0.86rem",
									color: "#0f172a",
									lineHeight: 1.5,
									whiteSpace: "pre-wrap",
									fontWeight: 500,
									maxHeight: "4.5em",
									overflowY: "auto",
									background: "#ffffff",
									border: "1px solid #e2e8f0",
									borderRadius: "5px",
									padding: "0.45rem 0.75rem",
									boxSizing: "border-box",
								}}
							>
								{caseItem.smsNotes ? (
									caseItem.smsNotes
								) : (
									<span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "0.84rem" }}>
										Awaiting SME prompt...
									</span>
								)}
							</div>
						</div>
					</div>

					{/* Page 1 Bottom Navigation Bar */}
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							padding: "0.55rem 0.2rem 0",
							borderTop: "1px solid #e2e8f0",
						}}
					>
						<span style={{ fontSize: "0.74rem", color: "#64748b" }}>
							Step 1 of 4
						</span>
						<button
							type="button"
							onClick={() => setActivePage("review1")}
							style={{
								background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
								color: "#ffffff",
								border: "none",
								padding: "0.45rem 1rem",
								borderRadius: "5px",
								fontSize: "0.78rem",
								fontWeight: 600,
								cursor: "pointer",
								display: "inline-flex",
								alignItems: "center",
								gap: "0.4rem",
								boxShadow: "0 1px 3px rgba(5, 150, 105, 0.2)",
							}}
						>
							<span>Next</span>
							<span>→</span>
						</button>
					</div>
				</div>
			)}

			{/* ─── PAGE 2: REVIEW 1 ─── */}
			{activePage === "review1" && (
				<div
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						gap: "0.75rem",
						overflow: "hidden",
					}}
				>
					{/* Page 2 Top Header */}
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							paddingBottom: "0.4rem",
							borderBottom: "1px solid #e2e8f0",
						}}
					>
						<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									width: "22px",
									height: "22px",
									borderRadius: "50%",
									background: "#059669",
									color: "#ffffff",
									fontSize: "0.72rem",
									fontWeight: 700,
								}}
							>
								2
							</span>
							<span
								style={{
									fontSize: "0.82rem",
									fontWeight: 700,
									color: "#0f172a",
									textTransform: "uppercase",
									letterSpacing: "0.04em",
								}}
							>
								Phase 2: Review 1
							</span>
						</div>
						<span
							style={{
								fontSize: "0.7rem",
								fontWeight: 600,
								padding: "2px 8px",
								borderRadius: "4px",
								background: isReview1Complete ? "#ecfdf5" : r1Cms ? "#eff6ff" : "#f1f5f9",
								color: isReview1Complete ? "#059669" : r1Cms ? "#2563eb" : "#64748b",
								border: isReview1Complete ? "1px solid #a7f3d0" : r1Cms ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
							}}
						>
							{isReview1Complete ? "✓ Completed" : r1Cms ? "In Review" : "Ready"}
						</span>
					</div>

					{/* Messages Area for Review 1 */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "0.75rem",
						}}
					>
						{!r1Cms && (
							<div
								style={{
									background: "#ffffff",
									border: "1px dashed #cbd5e1",
									borderRadius: "6px",
									padding: "1.25rem",
									textAlign: "center",
									color: "#64748b",
									fontSize: "0.82rem",
								}}
							>
								<div style={{ fontWeight: 600, color: "#0f172a", marginBottom: "0.25rem" }}>
									Review 1 Submission
								</div>
								<div>
									{role === "cms"
										? "Submit your queries and files below to begin Review 1."
										: "Awaiting client's Review 1 submission."}
								</div>
							</div>
						)}

					{/* REVIEW 1: CMS SUBMISSION */}
					{r1Cms && (
						<div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
							<div
								style={{
									background: "#f0f7ff",
									color: "#374151",
									border: "1px solid #bfdbfe",
									padding: "0.85rem 1.1rem",
									borderRadius: "8px 2px 8px 8px",
									width: editingPhase === "review1" ? "min(100%, 820px)" : "auto",
									minWidth: editingPhase === "review1" ? "min(100%, 750px)" : "280px",
									maxWidth: editingPhase === "review1" ? "95%" : "85%",
									transition: "all 0.2s ease",
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										gap: "0.75rem",
										fontSize: "0.74rem",
										color: "#6b7280",
										marginBottom: "0.4rem",
									}}
								>
									<span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600, color: "#2563eb" }}>
										<span>You</span>
										{r1Cms.editedAt && (
											<span style={{ fontSize: "0.7rem", color: "#3b82f6" }}>(edited)</span>
										)}
									</span>
									<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
										<span>{formatDate(r1Cms.timestamp)}</span>
										{!isCaseCompleted && editingPhase !== "review1" && (
											<button
												type="button"
												onClick={() => handleStartEdit("review1", r1Cms.text, r1Cms.documents)}
												style={{
													background: "rgba(37, 99, 235, 0.12)",
													border: "none",
													color: "#1d4ed8",
													borderRadius: "var(--radius-sm)",
													padding: "2px 8px",
													fontSize: "0.72rem",
													cursor: "pointer",
													fontWeight: 600,
													display: "inline-flex",
													alignItems: "center",
													gap: "0.25rem",
												}}
												title="Edit message & files"
											>
												<Icons.Edit /> Edit
											</button>
										)}
									</div>
								</div>

								{/* Inline Edit Form for Review 1 CMS message */}
								{editingPhase === "review1" ? (
									renderEditForm("review1", false)
								) : (
									<>
										<div
											style={{
												fontSize: "0.875rem",
												lineHeight: 1.55,
												whiteSpace: "pre-wrap",
												color: "#374151",
											}}
										>
											{r1Cms.text}
										</div>

										{r1Cms.documents && r1Cms.documents.length > 0 && (
											<div
												style={{
													marginTop: "0.5rem",
													display: "flex",
													flexWrap: "wrap",
													gap: "0.35rem",
												}}
											>
												{r1Cms.documents.map((d, i) => renderDocPill(d, i, true))}
											</div>
										)}
									</>
								)}
							</div>
						</div>
					)}

					{/* REVIEW 1: SMS REPLY */}
					{r1Sms && (
						<div style={{ display: "flex", justifyContent: "flex-start" }}>
							<div
								style={{
									background: "#ffffff",
									color: "#374151",
									border: "1px solid #e5e7eb",
									padding: "0.85rem 1.1rem",
									borderRadius: "2px 8px 8px 8px",
									minWidth: "280px",
									maxWidth: "85%",
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										gap: "0.75rem",
										fontSize: "0.74rem",
										color: "#6b7280",
										marginBottom: "0.4rem",
									}}
								>
									<span style={{ fontWeight: 600, color: "#059669" }}>
										Specialist
									</span>
									<span>{formatDate(r1Sms.timestamp)}</span>
								</div>

								<div
									style={{
										fontSize: "0.875rem",
										lineHeight: 1.55,
										whiteSpace: "pre-wrap",
										color: "#374151",
									}}
								>
									{r1Sms.text}
								</div>

								{r1Sms.documents && r1Sms.documents.length > 0 && (
									<div
										style={{
											marginTop: "0.5rem",
											display: "flex",
											flexWrap: "wrap",
											gap: "0.35rem",
										}}
									>
										{r1Sms.documents.map((d, i) => renderDocPill(d, i, false))}
									</div>
								)}
							</div>
						</div>
					)}

					{/* REVIEW 1 DECISION BAR */}
					{isReview1Complete && !isReview2Started && !isCaseCompleted && (
						<div
							style={{
								background: "#ffffff",
								border: "1px solid #e2e8f0",
								borderRadius: "6px",
								padding: "0.65rem 0.95rem",
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: "0.75rem",
								flexWrap: "wrap",
								boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
							}}
						>
							<span
								style={{
									fontSize: "0.8rem",
									color: "#0f172a",
									fontWeight: 500,
								}}
							>
								Review 1 complete.
							</span>
							<div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
								<span
									style={{
										fontSize: "0.76rem",
										color: "#64748b",
										fontStyle: "italic",
									}}
								>
									(Awaiting SME to conclude case)
								</span>
								<button
									type="button"
									onClick={handleProceedToReview2}
									disabled={isActing}
									style={{
										background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
										color: "#ffffff",
										border: "none",
										padding: "0.4rem 0.85rem",
										borderRadius: "4px",
										fontSize: "0.76rem",
										fontWeight: 600,
										cursor: "pointer",
										display: "inline-flex",
										alignItems: "center",
										gap: "0.3rem",
									}}
								>
									<span>Review 2</span> →
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Review 1 Input Form (if user turn and not actively editing) */}
				{!isReview1Complete && !editingPhase && (
					<div style={{ marginTop: "0.2rem" }}>
						{renderInputBar("Type Review 1 details for specialist...")}
					</div>
				)}

				{/* Page 2 Bottom Navigation */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						padding: "0.55rem 0.2rem 0",
						borderTop: "1px solid #e2e8f0",
					}}
				>
					<button
						type="button"
						onClick={() => setActivePage("assign")}
						style={{
							background: "#f1f5f9",
							color: "#334155",
							border: "1px solid #cbd5e1",
							padding: "0.4rem 0.9rem",
							borderRadius: "5px",
							fontSize: "0.76rem",
							fontWeight: 600,
							cursor: "pointer",
							display: "inline-flex",
							alignItems: "center",
							gap: "0.35rem",
						}}
					>
						<span>← Back</span>
					</button>

					<span style={{ fontSize: "0.74rem", color: "#64748b" }}>
						Step 2 of 4
					</span>

					<button
						type="button"
						onClick={() => setActivePage("review2")}
						style={{
							background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
							color: "#ffffff",
							border: "none",
							padding: "0.45rem 1rem",
							borderRadius: "5px",
							fontSize: "0.78rem",
							fontWeight: 600,
							cursor: "pointer",
							display: "inline-flex",
							alignItems: "center",
							gap: "0.4rem",
							boxShadow: "0 1px 3px rgba(5, 150, 105, 0.2)",
						}}
					>
						<span>Next</span>
						<span>→</span>
					</button>
				</div>
			</div>
		)}

		{/* ─── PAGE 3: REVIEW 2 (OPTIONAL) ─── */}
		{activePage === "review2" && (
			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					gap: "0.75rem",
					overflow: "hidden",
				}}
			>
				{/* Page 3 Top Header */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						paddingBottom: "0.4rem",
						borderBottom: "1px solid #e2e8f0",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
						<span
							style={{
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								width: "22px",
								height: "22px",
								borderRadius: "50%",
								background: "#059669",
								color: "#ffffff",
								fontSize: "0.72rem",
								fontWeight: 700,
							}}
						>
							3
						</span>
						<span
							style={{
								fontSize: "0.82rem",
								fontWeight: 700,
								color: "#0f172a",
								textTransform: "uppercase",
								letterSpacing: "0.04em",
							}}
						>
							Phase 3: Review 2 (Optional)
						</span>
					</div>
					<span
						style={{
							fontSize: "0.7rem",
							fontWeight: 600,
							padding: "2px 8px",
							borderRadius: "4px",
							background: isReview2Complete ? "#ecfdf5" : isReview2Started ? "#eff6ff" : "#f1f5f9",
							color: isReview2Complete ? "#059669" : isReview2Started ? "#2563eb" : "#64748b",
							border: isReview2Complete ? "1px solid #a7f3d0" : isReview2Started ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
						}}
					>
						{isReview2Complete ? "✓ Completed" : isReview2Started ? "In Progress" : "Optional"}
					</span>
				</div>

				{/* Messages Area for Review 2 */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "0.75rem",
					}}
				>
					{!isReview2Started ? (
						<div
							style={{
								background: "#ffffff",
								border: "1px dashed #cbd5e1",
								borderRadius: "6px",
								padding: "1.5rem",
								textAlign: "center",
								color: "#64748b",
								fontSize: "0.82rem",
							}}
						>
							<div style={{ fontWeight: 600, color: "#0f172a", marginBottom: "0.35rem", fontSize: "0.9rem" }}>
								Optional Review 2
							</div>
							<p style={{ margin: "0 0 0.85rem", lineHeight: 1.5 }}>
								Review 2 is available if you need additional legal clarification after Review 1.
							</p>
							{isReview1Complete ? (
								<div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
									<button
										type="button"
										onClick={handleProceedToReview2}
										disabled={isActing}
										style={{
											background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
											color: "#ffffff",
											border: "none",
											padding: "0.45rem 1rem",
											borderRadius: "5px",
											fontSize: "0.78rem",
											fontWeight: 600,
											cursor: "pointer",
											display: "inline-flex",
											alignItems: "center",
											gap: "0.3rem",
										}}
									>
										<span>Proceed to Review 2</span> →
									</button>
									<span style={{ fontSize: "0.78rem", color: "#64748b", fontStyle: "italic", alignSelf: "center" }}>
										(Or await SME Specialist to conclude case)
									</span>
								</div>
							) : (
								<div style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "0.78rem" }}>
									Please conclude Review 1 before initiating Review 2.
								</div>
							)}
						</div>
					) : (
						<>

							{/* REVIEW 2: CMS SUBMISSION */}
							{r2Cms && (
								<div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
									<div
										style={{
											background: "#f0f7ff",
											color: "#374151",
											border: "1px solid #bfdbfe",
											padding: "0.85rem 1.1rem",
											borderRadius: "8px 2px 8px 8px",
											width: editingPhase === "review2" ? "min(100%, 820px)" : "auto",
											minWidth: editingPhase === "review2" ? "min(100%, 750px)" : "280px",
											maxWidth: editingPhase === "review2" ? "95%" : "85%",
											transition: "all 0.2s ease",
										}}
									>
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												gap: "0.75rem",
												fontSize: "0.74rem",
												color: "#6b7280",
												marginBottom: "0.4rem",
											}}
										>
											<span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600, color: "#2563eb" }}>
												<span>You</span>
												{r2Cms.editedAt && (
													<span style={{ fontSize: "0.7rem", color: "#3b82f6" }}>(edited)</span>
												)}
											</span>
											<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
												<span>{formatDate(r2Cms.timestamp)}</span>
												{!isCaseCompleted && editingPhase !== "review2" && (
													<button
														type="button"
														onClick={() => handleStartEdit("review2", r2Cms.text, r2Cms.documents)}
														style={{
															background: "rgba(37, 99, 235, 0.12)",
															border: "none",
															color: "#1d4ed8",
															borderRadius: "var(--radius-sm)",
															padding: "2px 8px",
															fontSize: "0.72rem",
															cursor: "pointer",
															fontWeight: 600,
															display: "inline-flex",
															alignItems: "center",
															gap: "0.25rem",
														}}
														title="Edit message & files"
													>
														<Icons.Edit /> Edit
													</button>
												)}
											</div>
										</div>

										{/* Inline Edit Form for Review 2 CMS message */}
										{editingPhase === "review2" ? (
											renderEditForm("review2", false)
										) : (
											<>
												<div
													style={{
														fontSize: "0.875rem",
														lineHeight: 1.55,
														whiteSpace: "pre-wrap",
														color: "#374151",
													}}
												>
													{r2Cms.text}
												</div>

												{r2Cms.documents && r2Cms.documents.length > 0 && (
													<div
														style={{
															marginTop: "0.5rem",
															display: "flex",
															flexWrap: "wrap",
															gap: "0.35rem",
														}}
													>
														{r2Cms.documents.map((d, i) => renderDocPill(d, i, true))}
													</div>
												)}
											</>
										)}
									</div>
								</div>
							)}

							{/* REVIEW 2: SMS REPLY */}
							{r2Sms && (
								<div style={{ display: "flex", justifyContent: "flex-start" }}>
									<div
										style={{
											background: "#ffffff",
											color: "#374151",
											border: "1px solid #e5e7eb",
											padding: "0.85rem 1.1rem",
											borderRadius: "2px 8px 8px 8px",
											minWidth: "280px",
											maxWidth: "85%",
										}}
									>
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												gap: "0.75rem",
												fontSize: "0.74rem",
												color: "#6b7280",
												marginBottom: "0.4rem",
											}}
										>
											<span style={{ fontWeight: 600, color: "#059669" }}>
												Specialist
											</span>
											<span>{formatDate(r2Sms.timestamp)}</span>
										</div>

										<div
											style={{
												fontSize: "0.875rem",
												lineHeight: 1.55,
												whiteSpace: "pre-wrap",
												color: "#374151",
											}}
										>
											{r2Sms.text}
										</div>

										{r2Sms.documents && r2Sms.documents.length > 0 && (
											<div
												style={{
													marginTop: "0.5rem",
													display: "flex",
													flexWrap: "wrap",
													gap: "0.35rem",
												}}
											>
												{r2Sms.documents.map((d, i) => renderDocPill(d, i, false))}
											</div>
										)}
									</div>
								</div>
							)}

							{/* REVIEW 2 CONCLUDED BAR */}
							{isReview2Complete && !isCaseCompleted && (
								<div
									style={{
										background: "#ffffff",
										border: "1px solid #e2e8f0",
										borderRadius: "6px",
										padding: "0.65rem 0.95rem",
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										gap: "0.75rem",
										flexWrap: "wrap",
										boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
									}}
								>
									<span
										style={{
											fontSize: "0.8rem",
											color: "#059669",
											fontWeight: 600,
											display: "inline-flex",
											alignItems: "center",
											gap: "0.3rem",
										}}
									>
										<Icons.Check /> Review 2 completed.
									</span>
									<span style={{ fontSize: "0.76rem", color: "#64748b", fontStyle: "italic" }}>
										(Awaiting SME Specialist to complete case)
									</span>
								</div>
							)}
						</>
					)}
				</div>

				{/* Review 2 Input Form (if Review 2 is active and not complete and not editing) */}
				{isReview2Started && !isReview2Complete && !editingPhase && (
					<div style={{ marginTop: "0.2rem" }}>
						{renderInputBar("Type Review 2 follow-up details...")}
					</div>
				)}

				{/* Page 3 Bottom Navigation */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						padding: "0.55rem 0.2rem 0",
						borderTop: "1px solid #e2e8f0",
					}}
				>
					<button
						type="button"
						onClick={() => setActivePage("review1")}
						style={{
							background: "#f1f5f9",
							color: "#334155",
							border: "1px solid #cbd5e1",
							padding: "0.4rem 0.9rem",
							borderRadius: "5px",
							fontSize: "0.76rem",
							fontWeight: 600,
							cursor: "pointer",
							display: "inline-flex",
							alignItems: "center",
							gap: "0.35rem",
						}}
					>
						<span>← Back</span>
					</button>

					<span style={{ fontSize: "0.74rem", color: "#64748b" }}>
						Step 3 of 4
					</span>

					<button
						type="button"
						onClick={() => setActivePage("complete")}
						style={{
							background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
							color: "#ffffff",
							border: "none",
							padding: "0.45rem 1rem",
							borderRadius: "5px",
							fontSize: "0.78rem",
							fontWeight: 600,
							cursor: "pointer",
							display: "inline-flex",
							alignItems: "center",
							gap: "0.4rem",
							boxShadow: "0 1px 3px rgba(5, 150, 105, 0.2)",
						}}
					>
						<span>Next</span>
						<span>→</span>
					</button>
				</div>
			</div>
		)}

		{/* ─── PAGE 4: CASE ANALYSIS COMPLETION DASHBOARD ─── */}
		{activePage === "complete" && (
			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					gap: "0.75rem",
					overflowY: "auto",
					paddingRight: "2px",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "0.85rem",
					}}
				>
					{/* Page 4 Header */}
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							paddingBottom: "0.45rem",
							borderBottom: "1px solid #e2e8f0",
						}}
					>
						<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									width: "22px",
									height: "22px",
									borderRadius: "50%",
									background: "#059669",
									color: "#ffffff",
									fontSize: "0.72rem",
									fontWeight: 700,
								}}
							>
								4
							</span>
							<span
								style={{
									fontSize: "0.82rem",
									fontWeight: 700,
									color: "#0f172a",
									textTransform: "uppercase",
									letterSpacing: "0.04em",
								}}
							>
								Phase 4: Completion
							</span>
						</div>
						<span
							style={{
								fontSize: "0.7rem",
								fontWeight: 600,
								padding: "2px 8px",
								borderRadius: "4px",
								background: isCaseCompleted ? "#ecfdf5" : "#eff6ff",
								color: isCaseCompleted ? "#059669" : "#2563eb",
								border: isCaseCompleted ? "1px solid #a7f3d0" : "1px solid #bfdbfe",
							}}
						>
							{isCaseCompleted ? "✓ Completed" : "In Progress"}
						</span>
					</div>

					{/* Status Banner */}
					<div
						style={{
							background: isCaseCompleted ? "#f0fdf4" : "#f8fafc",
							border: isCaseCompleted ? "1.5px solid #a7f3d0" : "1px solid #e2e8f0",
							borderRadius: "8px",
							padding: "0.85rem 1.1rem",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							gap: "1rem",
							flexWrap: "wrap",
						}}
					>
						<div>
							<div
								style={{
									fontSize: "0.92rem",
									fontWeight: 700,
									color: isCaseCompleted ? "#065f46" : "#0f172a",
									marginBottom: "0.2rem",
									display: "flex",
									alignItems: "center",
									gap: "0.4rem",
								}}
							>
								{isCaseCompleted ? <Icons.Check /> : "●"}
								<span>{isCaseCompleted ? "Case Analysis Completed" : `Status: ${caseItem.status || "In Review"}`}</span>
							</div>
							<div style={{ fontSize: "0.76rem", color: "#64748b" }}>
								{isCaseCompleted
									? `Concluded on ${formatDate(caseItem.completedAt || caseItem.updatedAt)}.`
									: `Progress: ${progressPercent}% complete`}
							</div>
						</div>

						{!isCaseCompleted && (
							<div
								style={{
									background: "#f8fafc",
									border: "1px solid #e2e8f0",
									padding: "0.45rem 0.85rem",
									borderRadius: "5px",
									fontSize: "0.78rem",
									color: "#64748b",
									fontStyle: "italic",
									display: "inline-flex",
									alignItems: "center",
									gap: "0.4rem",
								}}
							>
								<Icons.Clock />
								<span>Awaiting SME Specialist authorization to complete case</span>
							</div>
						)}
					</div>

					{/* Phase Breakdown Summary Cards */}
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
							gap: "0.65rem",
						}}
					>
						{/* Phase 1 Summary */}
						<div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0.65rem 0.85rem" }}>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
								<span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", textTransform: "uppercase" }}>
									1. Assignment
								</span>
								<span style={{ fontSize: "0.68rem", color: isAssignPhaseDone ? "#059669" : "#64748b", fontWeight: 600 }}>
									{isAssignPhaseDone ? "✓ Done" : "Pending"}
								</span>
							</div>
							<div style={{ fontSize: "0.76rem", color: "#64748b", lineHeight: 1.4 }}>
								{verifiedDocs.length} of {clientUploadedDocs.length} files retained
							</div>
						</div>

						{/* Phase 2 Summary */}
						<div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0.65rem 0.85rem" }}>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
								<span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", textTransform: "uppercase" }}>
									2. Review 1
								</span>
								<span style={{ fontSize: "0.68rem", color: isReview1Complete ? "#059669" : r1Cms ? "#2563eb" : "#64748b", fontWeight: 600 }}>
									{isReview1Complete ? "✓ Completed" : r1Cms ? "In Review" : "Pending"}
								</span>
							</div>
							<div style={{ fontSize: "0.76rem", color: "#64748b", lineHeight: 1.4 }}>
								{isReview1Complete ? "Client submission and specialist reply recorded" : "Pending review exchange"}
							</div>
						</div>

						{/* Phase 3 Summary */}
						<div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0.65rem 0.85rem" }}>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
								<span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", textTransform: "uppercase" }}>
									3. Review 2
								</span>
								<span style={{ fontSize: "0.68rem", color: isReview2Complete ? "#059669" : isReview2Started ? "#2563eb" : "#64748b", fontWeight: 600 }}>
									{isReview2Complete ? "✓ Completed" : isReview2Started ? "In Progress" : "Optional"}
								</span>
							</div>
							<div style={{ fontSize: "0.76rem", color: "#64748b", lineHeight: 1.4 }}>
								{isReview2Complete ? "Follow-up completed" : isReview2Started ? "In progress" : "Not requested"}
							</div>
						</div>
					</div>

					{/* Specialist Final Guidance Notes */}
					{caseItem.smsNotes && (
						<div
							style={{
								background: "#ffffff",
								border: "1px solid #e2e8f0",
								borderLeft: "4px solid #059669",
								borderRadius: "6px",
								padding: "0.65rem 0.85rem",
							}}
						>
							<div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#065f46", textTransform: "uppercase", marginBottom: "0.2rem" }}>
								SME Prompt:
							</div>
							<div style={{ fontSize: "0.82rem", color: "#0f172a", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
								{caseItem.smsNotes}
							</div>
						</div>
					)}
				</div>

				{/* Page 4 Bottom Navigation Bar */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						padding: "0.6rem 0.2rem 0",
						borderTop: "1px solid #e2e8f0",
					}}
				>
					<button
						type="button"
						onClick={() => setActivePage(isReview2Started ? "review2" : "review1")}
						style={{
							background: "#f1f5f9",
							color: "#334155",
							border: "1px solid #cbd5e1",
							padding: "0.4rem 0.9rem",
							borderRadius: "5px",
							fontSize: "0.76rem",
							fontWeight: 600,
							cursor: "pointer",
							display: "inline-flex",
							alignItems: "center",
							gap: "0.35rem",
						}}
					>
						<span>← Back</span>
					</button>

					<span style={{ fontSize: "0.74rem", color: "#059669", fontWeight: 600 }}>
						Step 4 of 4
					</span>
				</div>
			</div>
		)}

		<div ref={chatEndRef} />
		<input
			type="file"
			ref={editFileInputRef}
			onChange={handleEditFileUpload}
			style={{ display: "none" }}
			multiple
		/>
	</div>
			</div>
		</div>
	);
}
