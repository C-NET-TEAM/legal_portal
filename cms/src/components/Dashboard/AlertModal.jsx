import { useState } from "react";
import { getApiBase } from "../../api";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

export default function AlertModal({
	alert,
	caseItem,
	unseenMessages = [],
	onClose,
	onOpenTimeline,
}) {
	useBodyScrollLock(Boolean(alert));
	const [copied, setCopied] = useState(false);

	const formatDateDMY = (dateStr) => {
		if (!dateStr) return "";
		const d = new Date(dateStr);
		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0");
		let hours = d.getHours();
		const minutes = String(d.getMinutes()).padStart(2, "0");
		const ampm = hours >= 12 ? "pm" : "am";
		hours = hours % 12 || 12;
		return `${day}/${month}/${d.getFullYear()}, ${hours}:${minutes} ${ampm}`;
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

	const getFileExtension = (filename) => {
		if (!filename) return "FILE";
		const parts = filename.split(".");
		return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
	};

	const getExtBadgeStyle = (ext) => {
		const upper = ext.toUpperCase();
		if (upper === "PDF") {
			return { bg: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "rgba(239, 68, 68, 0.3)" };
		}
		if (upper === "DOC" || upper === "DOCX") {
			return { bg: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" };
		}
		if (["JPG", "JPEG", "PNG", "WEBP"].includes(upper)) {
			return { bg: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "rgba(16, 185, 129, 0.3)" };
		}
		return { bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" };
	};

	if (!alert) return null;

	const rawData = alert.structuredData || {};
	const data = {
		...(caseItem || {}),
		...rawData,
		caseVertical:
			rawData.caseVertical ||
			rawData.category ||
			caseItem?.caseVertical ||
			caseItem?.category ||
			"MSME/A&C related",
		category:
			rawData.category ||
			rawData.caseVertical ||
			caseItem?.category ||
			caseItem?.caseVertical ||
			"MSME/A&C related",
		caseCategory:
			(rawData.caseCategory && rawData.caseCategory !== "N/A"
				? rawData.caseCategory
				: "") ||
			(rawData.caseKeywords && rawData.caseKeywords !== "N/A"
				? rawData.caseKeywords
				: "") ||
			caseItem?.caseCategory ||
			caseItem?.caseKeywords ||
			"Deputation Related",
		caseKeywords:
			(rawData.caseKeywords && rawData.caseKeywords !== "N/A"
				? rawData.caseKeywords
				: "") ||
			(rawData.caseCategory && rawData.caseCategory !== "N/A"
				? rawData.caseCategory
				: "") ||
			caseItem?.caseKeywords ||
			caseItem?.caseCategory ||
			"Deputation Related",
		clientType: rawData.clientType || caseItem?.clientType || "Individual",
		clientName: rawData.clientName || caseItem?.clientName || "Client",
		title: rawData.title || caseItem?.title || "",
	};
	const smsNotes = data.smsNotes || alert.message || "";
	const selectedDocs =
		data.selectedDocuments && data.selectedDocuments.length > 0
			? data.selectedDocuments
			: caseItem?.selectedDocuments || [];

	const docsText =
		selectedDocs.length > 0
			? `[SELECTED DOCUMENTS FOR LEX AI]:\n` +
			selectedDocs
				.map((d, i) => `${i + 1}. ${d.name} (${d.size || "Exhibit"})`)
				.join("\n") +
			`\n\n➔ Instructions: Use the above documents for Lex AI, and then use the prompt below:\n\n`
			: "";

	const baseDirectives =
		unseenMessages && unseenMessages.length > 1
			? unseenMessages
				.map((m, idx) => `[Reply ${idx + 1}] ${m.text || m.message}`)
				.join("\n\n")
			: smsNotes;

	const copyText = docsText ? `${docsText}[LEX AI PROMPT / DIRECTIVES]:\n${baseDirectives}` : baseDirectives;

	const handleCopy = () => {
		if (copyText) {
			navigator.clipboard.writeText(copyText);
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		}
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
		>
			<div
				className="modal-window modal-window-lg"
				style={{
					boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
					borderRadius: "var(--radius-lg)",
				}}
			>
				{/* Header */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						borderBottom: "1px solid var(--border-subtle)",
						paddingBottom: "1.25rem",
						marginBottom: "1.5rem",
					}}
				>
					<div>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.6rem",
								marginBottom: "0.35rem",
							}}
						>
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								style={{ color: "var(--primary)" }}
							>
								<title>SMS Specialist Response</title>
								<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
								<polyline points="12 11 12 17 9 14"></polyline>
								<line x1="12" y1="17" x2="15" y2="14"></line>
							</svg>
							<h2 style={{ fontSize: "1.4rem", color: "var(--text-main)" }}>
								SMS Specialist Response
							</h2>
							<span
								className={`badge ${data.status === "Approved"
									? "badge-approved"
									: data.status === "Completed"
										? "badge-completed"
										: "badge-pending"
									}`}
								style={{ marginLeft: "0.5rem" }}
							>
								{data.status || "Reviewed"}
							</span>
						</div>
						<div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
							Case Ref:{" "}
							<strong style={{ color: "var(--text-main)" }}>
								{alert.caseId || data.caseId}
							</strong>{" "}
							| Received: {formatDateDMY(alert.createdAt)}
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							color: "var(--text-muted)",
							fontSize: "1.75rem",
							cursor: "pointer",
							lineHeight: 1,
						}}
					>
						&times;
					</button>
				</div>

				{/* Structured Body */}
				<div
					style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
				>
					{/* Grid of Key Properties */}
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
							gap: "1rem",
						}}
					>
						<div
							style={{
								background: "rgba(0,0,0,0.02)",
								border: "1px solid var(--border-subtle)",
								padding: "1.25rem",
								borderRadius: "var(--radius-md)",
								borderTop: "3px solid var(--text-muted)",
							}}
						>
							<div
								style={{
									fontSize: "0.75rem",
									color: "var(--text-dim)",
									textTransform: "uppercase",
									fontWeight: 700,
									marginBottom: "0.35rem",
								}}
							>
								Applicant
							</div>
							<div
								style={{
									fontSize: "1.05rem",
									fontWeight: 600,
									color: "var(--text-main)",
								}}
							>
								{data.title ? `${data.title} ` : ""}{data.clientName || "Client"}
							</div>
							<div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
								Type: {data.clientType || "Individual"}
							</div>
						</div>

						<div
							style={{
								background: "rgba(0,0,0,0.02)",
								border: "1px solid var(--border-subtle)",
								padding: "1.25rem",
								borderRadius: "var(--radius-md)",
								borderTop: "3px solid var(--text-muted)",
							}}
						>
							<div
								style={{
									fontSize: "0.75rem",
									color: "var(--text-dim)",
									textTransform: "uppercase",
									fontWeight: 700,
									marginBottom: "0.35rem",
								}}
							>
								Vertical / Category
							</div>
							<div
								style={{
									fontSize: "1.05rem",
									fontWeight: 600,
									color: "var(--text-main)",
								}}
							>
								{data.caseVertical || data.category || "MSME/A&C related"}
							</div>
							<div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
								Category: {data.caseCategory || data.caseKeywords || "Deputation Related"}
							</div>
						</div>

						<div
							style={{
								background: "rgba(0,0,0,0.02)",
								border: "1px solid var(--border-subtle)",
								padding: "1.25rem",
								borderRadius: "var(--radius-md)",
								borderTop: "3px solid #059669",
							}}
						>
							<div
								style={{
									fontSize: "0.75rem",
									color: "var(--text-dim)",
									textTransform: "uppercase",
									fontWeight: 700,
									marginBottom: "0.35rem",
								}}
							>
								Reviewing Authority
							</div>
							<div
								style={{
									fontSize: "1.05rem",
									fontWeight: 600,
									color: "#059669",
								}}
							>
								{data.reviewerInfo
									? data.reviewerInfo.smsId
									: "SMS Specialist Desk"}
							</div>
							{data.reviewerInfo?.position && (
								<div
									style={{
										fontSize: "0.8rem",
										color: "var(--text-dim)",
										marginTop: "0.2rem",
									}}
								>
									{data.reviewerInfo.position}
								</div>
							)}
						</div>
					</div>

					{/* Designated Documents for Lex AI by SMS */}
					{selectedDocs.length > 0 && (
						<div
							style={{
								background: "rgba(37, 99, 235, 0.05)",
								border: "1.5px solid rgba(37, 99, 235, 0.35)",
								borderRadius: "var(--radius-md)",
								padding: "1.25rem",
								borderLeft: "4px solid #2563eb",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: "0.5rem",
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
										fontSize: "0.85rem",
										fontWeight: 700,
										textTransform: "uppercase",
										color: "#2563eb",
									}}
								>
									<span>📄 Selected Documents for Lex AI ({selectedDocs.length})</span>
								</div>
								<span
									style={{
										fontSize: "0.72rem",
										background: "rgba(37, 99, 235, 0.12)",
										color: "#1d4ed8",
										padding: "2px 8px",
										borderRadius: "4px",
										fontWeight: 700,
									}}
								>
									SMS Specialist Selected
								</span>
							</div>

							<div
								style={{
									fontSize: "0.85rem",
									color: "#1e293b",
									marginBottom: "0.75rem",
									fontWeight: 600,
								}}
							>
								➔ Using these documents for Lex AI, and then use the prompt below:
							</div>

							<div
								style={{
									border: "1px solid var(--border-subtle)",
									borderRadius: "4px",
									overflowX: "auto",
									background: "#ffffff",
								}}
							>
								<table
									style={{
										width: "100%",
										borderCollapse: "collapse",
										fontSize: "0.82rem",
										textAlign: "left",
									}}
								>
									<thead>
										<tr
											style={{
												background: "rgba(0, 0, 0, 0.03)",
												borderBottom: "1px solid var(--border-subtle)",
												fontSize: "0.72rem",
												textTransform: "uppercase",
												color: "var(--text-dim)",
											}}
										>
											<th style={{ padding: "0.5rem 0.75rem", width: "100px" }}>S.No.</th>
											<th style={{ padding: "0.5rem 0.75rem" }}>Document Name</th>
											<th style={{ padding: "0.5rem 0.75rem", width: "90px" }}>Type</th>
											<th style={{ padding: "0.5rem 0.75rem", width: "100px", textAlign: "right" }}>Action</th>
										</tr>
									</thead>
									<tbody>
										{selectedDocs.map((doc, idx) => {
											const ext = getFileExtension(doc.name);
											const extStyle = getExtBadgeStyle(ext);
											return (
												<tr
													key={doc.url || doc.name || idx}
													style={{ borderBottom: "1px solid var(--border-subtle)" }}
												>
													<td style={{ padding: "0.5rem 0.75rem", fontWeight: 600, color: "var(--text-dim)" }}>
														{idx + 1}
													</td>
													<td style={{ padding: "0.5rem 0.75rem", fontWeight: 600, color: "var(--text-main)" }}>
														{doc.name} {doc.size ? `(${doc.size})` : ""}
													</td>
													<td style={{ padding: "0.5rem 0.75rem" }}>
														<span
															style={{
																background: extStyle.bg,
																color: extStyle.color,
																border: `1px solid ${extStyle.border}`,
																fontSize: "0.65rem",
																padding: "2px 6px",
																borderRadius: "3px",
																fontWeight: 800,
															}}
														>
															{ext}
														</span>
													</td>
													<td style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>
														<a
															onClick={(e) => handleOpenDocument(e, doc.url)}
															href={doc.url || "#"}
															style={{
																color: "#2563eb",
																fontWeight: 600,
																fontSize: "0.76rem",
																textDecoration: "underline",
																cursor: "pointer",
															}}
														>
															👁 View
														</a>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* SMS Specialist Notes & Instructions (Doubles as AI Prompt) */}
					<div
						style={{
							background: "rgba(16, 185, 129, 0.05)",
							border: "1px solid rgba(16, 185, 129, 0.3)",
							borderRadius: "var(--radius-md)",
							padding: "1.5rem",
							borderLeft: "4px solid #059669",
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "0.75rem",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									fontSize: "0.82rem",
									fontWeight: 700,
									textTransform: "uppercase",
									color: "#059669",
								}}
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<title>Subject Matter Expert Instructions</title>
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
									<polyline points="14 2 14 8 20 8"></polyline>
									<line x1="16" y1="13" x2="8" y2="13"></line>
									<line x1="16" y1="17" x2="8" y2="17"></line>
									<polyline points="10 9 9 9 8 9"></polyline>
								</svg>
								subject matter expert Instructions
							</div>
							<button
								type="button"
								className="btn btn-secondary"
								style={{
									padding: "0.35rem 0.75rem",
									fontSize: "0.78rem",
									background: copied ? "rgba(16,185,129,0.1)" : "#fff",
									borderColor: copied ? "#059669" : "var(--border-subtle)",
									color: copied ? "#059669" : "var(--text-muted)",
								}}
								onClick={handleCopy}
							>
								{copied ? (
									"✓ Copied"
								) : (
									<span
										style={{
											display: "flex",
											alignItems: "center",
											gap: "4px",
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
											<title>Copy Instructions</title>
											<rect
												x="9"
												y="9"
												width="13"
												height="13"
												rx="2"
												ry="2"
											></rect>
											<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
										</svg>
										Copy Instructions
									</span>
								)}
							</button>
						</div>
						{unseenMessages && unseenMessages.length > 1 ? (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "0.65rem",
								}}
							>
								<div
									style={{
										fontSize: "0.74rem",
										fontWeight: 700,
										color: "#059669",
										display: "flex",
										alignItems: "center",
										gap: "0.4rem",
										marginBottom: "0.15rem",
									}}
								>
									<span
										style={{
											width: "6px",
											height: "6px",
											borderRadius: "50%",
											background: "#059669",
										}}
									></span>
									{unseenMessages.length} Unseen Specialist Replies:
								</div>
								{unseenMessages.map((msg, idx) => (
									<div
										key={msg._id || msg.id || msg.timestamp || msg.text || idx}
										style={{
											background: "#ffffff",
											border: "1px solid rgba(16, 185, 129, 0.25)",
											borderRadius: "6px",
											padding: "0.7rem 0.9rem",
											boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
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
													fontSize: "0.72rem",
													fontWeight: 700,
													color: "#059669",
												}}
											>
												Reply #{idx + 1}
											</span>
											{msg.timestamp && (
												<span
													style={{
														fontSize: "0.68rem",
														color: "var(--text-dim)",
													}}
												>
													{formatDateDMY(msg.timestamp)}
												</span>
											)}
										</div>
										<div
											style={{
												fontSize: "0.92rem",
												color: "var(--text-main)",
												lineHeight: 1.5,
												whiteSpace: "pre-wrap",
											}}
										>
											{msg.text || msg.message}
										</div>
									</div>
								))}
							</div>
						) : (
							<p
								style={{
									margin: "0",
									fontSize: "0.95rem",
									lineHeight: 1.6,
									color: "var(--text-main)",
									fontWeight: 500,
									whiteSpace: "pre-wrap",
								}}
							>
								{smsNotes}
							</p>
						)}
					</div>

					{/* Action Footer */}
					{onOpenTimeline && (
						<div
							style={{
								display: "flex",
								justifyContent: "flex-end",
								paddingTop: "0.75rem",
								borderTop: "1px solid var(--border-subtle)",
							}}
						>
							<button
								type="button"
								className="btn btn-primary"
								style={{
									background: "#111827",
									color: "#ffffff",
									padding: "0.65rem 1.25rem",
									fontSize: "0.86rem",
									borderRadius: "var(--radius-md)",
									display: "inline-flex",
									alignItems: "center",
									gap: "0.5rem",
									cursor: "pointer",
									border: "1px solid #111827",
								}}
								onClick={() => {
									onClose();
									onOpenTimeline(alert.caseId || data.caseId);
								}}
							>
								<span>💬 Open Case Timeline & Chat ➔</span>
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
