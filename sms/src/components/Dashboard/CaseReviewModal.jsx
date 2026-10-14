import { useState } from "react";
import { api, getApiBase } from "../../api";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

export default function CaseReviewModal({
	caseItem,
	onClose,
	onReviewSuccess,
	smsUser,
}) {
	useBodyScrollLock();

	const [smsNotes, setSmsNotes] = useState(caseItem.smsNotes || "");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [selectedDocIndices, setSelectedDocIndices] = useState(() => {
		if (caseItem.selectedDocuments?.length && caseItem.documents?.length) {
			const urls = new Set(
				caseItem.selectedDocuments.map((d) => d.url || d.name),
			);
			return caseItem.documents
				.map((d, i) => (urls.has(d.url || d.name) ? i : -1))
				.filter((i) => i !== -1);
		}
		return [];
	});

	const handleToggleDoc = (idx) => {
		setSelectedDocIndices((prev) =>
			prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
		);
	};

	const handleSelectAllDocs = () => {
		if (selectedDocIndices.length === (caseItem.documents || []).length) {
			setSelectedDocIndices([]);
		} else {
			setSelectedDocIndices((caseItem.documents || []).map((_, idx) => idx));
		}
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

	const formatDateDMY = (dateStr) => {
		if (!dateStr) return "";
		const d = new Date(dateStr);
		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0");
		return `${day}/${month}/${d.getFullYear()}`;
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

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		setLoading(true);
		try {
			const selectedDocuments = (caseItem.documents || []).filter((_, idx) =>
				selectedDocIndices.includes(idx),
			);
			await api.reviewCase(caseItem.id, {
				status: "Approved",
				smsNotes,
				selectedDocuments,
				reviewerInfo: smsUser
					? {
						name: `${smsUser.firstName} ${smsUser.lastName}`,
						position: smsUser.position,
						smsId: smsUser.smsId,
						profileImage: smsUser.profileImage,
					}
					: null,
			});
			onReviewSuccess();
			onClose();
		} catch (err) {
			setError(err.message || "Failed to submit case approval");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="modal-backdrop-formal"
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
			<div className="modal-window-formal">
				{/* Header */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						borderBottom: "2px solid var(--border-subtle)",
						paddingBottom: "1rem",
						marginBottom: "1rem",
					}}
				>
					<div>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
								marginBottom: "0.25rem",
							}}
						>
							<img
								src="/sms-icon-transparent.png"
								alt="SMS Logo"
								style={{
									width: "clamp(30px, 3.5vw, 48px)",
									height: "clamp(30px, 3.5vw, 48px)",
									objectFit: "contain",
									borderRadius: "4px",
								}}
							/>
							<h2
								style={{
									fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)",
									fontFamily: "serif",
									margin: 0,
									fontWeight: 700,
								}}
							>
								OFFICIAL CASE REVIEW
							</h2>
						</div>
						<div
							style={{
								fontSize: "0.85rem",
								color: "var(--text-dim)",
								marginTop: "0.2rem",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
							}}
						>
							Client ID:{" "}
							<strong style={{ color: "var(--text-main)" }}>
								{caseItem.clientId}
							</strong>{" "}
							| Case ID:{" "}
							<strong style={{ color: "var(--text-main)" }}>
								{caseItem.id}
							</strong>{" "}
							| Filed: {formatDateDMY(caseItem.createdAt)}
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

				{error && (
					<div
						style={{
							background: "rgba(239, 68, 68, 0.15)",
							border: "1px solid rgba(239, 68, 68, 0.3)",
							color: "#f87171",
							padding: "0.75rem 1rem",
							borderRadius: "var(--radius-sm)",
							fontSize: "0.85rem",
							marginBottom: "1.25rem",
						}}
					>
						{error}
					</div>
				)}

				{/* Case Info Summary Card */}
				<div
					style={{
						background: "var(--surface-light)",
						border: "1px solid var(--border-subtle)",
						padding: "1rem 1.25rem",
						marginBottom: "1.25rem",
					}}
				>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
							gap: "0.75rem",
							marginBottom: "1rem",
						}}
					>
						<div>
							<div
								style={{
									fontSize: "0.75rem",
									color: "var(--text-dim)",
									textTransform: "uppercase",
									fontWeight: 700,
								}}
							>
								Applicant Name
							</div>
							<div
								style={{
									fontWeight: 600,
									color: "var(--text-main)",
									fontFamily: "serif",
									fontSize: "1.1rem",
								}}
							>
								{caseItem.title ? `${caseItem.title} ` : ""}{caseItem.clientName}
							</div>
						</div>
						<div>
							<div
								style={{
									fontSize: "0.75rem",
									color: "var(--text-dim)",
									textTransform: "uppercase",
									fontWeight: 700,
								}}
							>
								Applicant Type
							</div>
							<div style={{ fontWeight: 600, color: "var(--text-main)" }}>
								{caseItem.clientType || (caseItem.age || caseItem.sex ? `${caseItem.age || "N/A"} / ${caseItem.sex || "N/A"}` : "Individual")}
							</div>
						</div>
						<div>
							<div
								style={{
									fontSize: "0.75rem",
									color: "var(--text-dim)",
									textTransform: "uppercase",
									fontWeight: 700,
								}}
							>
								City / State
							</div>
							<div style={{ fontWeight: 600, color: "var(--text-main)" }}>
								{caseItem.city}, {caseItem.state}
							</div>
						</div>
						<div>
							<div
								style={{
									fontSize: "0.75rem",
									color: "var(--text-dim)",
									textTransform: "uppercase",
									fontWeight: 700,
								}}
							>
								Case Vertical
							</div>
							<div style={{ fontWeight: 600, color: "var(--text-main)" }}>
								{caseItem.category || caseItem.caseVertical || "N/A"}
							</div>
						</div>
						<div>
							<div
								style={{
									fontSize: "0.75rem",
									color: "var(--text-dim)",
									textTransform: "uppercase",
									fontWeight: 700,
								}}
							>
								Case Category
							</div>
							<div style={{ fontWeight: 600, color: "var(--text-main)" }}>
								{caseItem.caseCategory || caseItem.caseKeywords || "N/A"}
							</div>
						</div>
					</div>

					<div>
						<div
							style={{
								fontSize: "0.75rem",
								color: "var(--text-dim)",
								textTransform: "uppercase",
								fontWeight: 700,
								marginBottom: "0.5rem",
								borderBottom: "1px dashed var(--border-subtle)",
								paddingBottom: "0.2rem",
							}}
						>
							Case Brief
						</div>
						<div
							style={{
								padding: "0.5rem 0",
								fontSize: "0.95rem",
								lineHeight: 1.6,
								color: "var(--text-main)",
								fontFamily: "serif",
							}}
						>
							{caseItem.details}
						</div>
					</div>

					<div style={{ marginTop: "0.75rem" }}>
						<div
							style={{
								fontSize: "0.75rem",
								color: "var(--text-dim)",
								textTransform: "uppercase",
								fontWeight: 700,
								marginBottom: "0.5rem",
								borderBottom: "1px dashed var(--border-subtle)",
								paddingBottom: "0.2rem",
							}}
						>
							Case Summary
						</div>
						<div
							style={{
								padding: "0.5rem 0",
								fontSize: "0.95rem",
								lineHeight: 1.6,
								color: "var(--text-main)",
								fontFamily: "serif",
								whiteSpace: "pre-wrap",
							}}
						>
							{caseItem.summary || (
								<span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>
									No additional summary provided
								</span>
							)}
						</div>
					</div>

					{/* Documents Standard Table */}
					{caseItem.documents && caseItem.documents.length > 0 && (
						<div style={{ marginTop: "1.25rem" }}>
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
										fontSize: "0.8rem",
										color: "var(--text-main)",
										textTransform: "uppercase",
										fontWeight: 700,
										letterSpacing: "0.04em",
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<span>Exhibits Attached </span>
									{selectedDocIndices.length > 0 && (
										<span
											style={{
												background: "rgba(16, 185, 129, 0.15)",
												color: "#10b981",
												border: "1px solid rgba(16, 185, 129, 0.35)",
												fontSize: "0.68rem",
												padding: "1px 7px",
												borderRadius: "4px",
												fontWeight: 700,
												textTransform: "none",
											}}
										>
											✓ {selectedDocIndices.length} Selected for Lex AI
										</span>
									)}
								</div>
								<button
									type="button"
									onClick={handleSelectAllDocs}
									style={{
										background: "none",
										border: "none",
										color: "#3b82f6",
										fontSize: "0.75rem",
										fontWeight: 600,
										cursor: "pointer",
										textDecoration: "underline",
									}}
								>
									{selectedDocIndices.length === caseItem.documents.length
										? "Deselect All"
										: "Select All Documents"}
								</button>
							</div>

							<div
								style={{
									border: "1px solid var(--border-subtle)",
									borderRadius: "4px",
									overflowX: "auto",
									background: "var(--surface)",
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
												background: "rgba(0, 0, 0, 0.04)",
												borderBottom: "1.5px solid var(--border-subtle)",
												color: "var(--text-dim)",
												fontSize: "0.72rem",
												textTransform: "uppercase",
												fontWeight: 700,
												letterSpacing: "0.05em",
											}}
										>
											<th style={{ padding: "0.6rem 0.75rem", width: "120px" }}>
												S.No.
											</th>
											<th style={{ padding: "0.6rem 0.75rem" }}>
												Documents
											</th>
											<th
												style={{
													padding: "0.6rem 0.75rem",
													width: "180px",
													textAlign: "center",
												}}
											>
												Select Box
											</th>
										</tr>
									</thead>
									<tbody>
										{caseItem.documents.map((d, idx) => {
											const ext = getFileExtension(d.name);
											const extStyle = getExtBadgeStyle(ext);
											const isSelected = selectedDocIndices.includes(idx);
											return (
												<tr
													key={d.url || d.name || `doc-${idx}`}
													style={{
														borderBottom: "1px solid var(--border-subtle)",
														background: isSelected
															? "rgba(16, 185, 129, 0.06)"
															: "transparent",
														transition: "background 0.15s ease",
													}}
												>
													<td
														style={{
															padding: "0.65rem 0.75rem",
															fontWeight: 600,
															color: "var(--text-dim)",
															whiteSpace: "nowrap",
														}}
													>
														{idx + 1}
													</td>
													<td style={{ padding: "0.65rem 0.75rem" }}>
														<div
															style={{
																display: "flex",
																alignItems: "center",
																gap: "0.6rem",
																flexWrap: "wrap",
															}}
														>
															<span
																style={{
																	background: extStyle.bg,
																	color: extStyle.color,
																	border: `1px solid ${extStyle.border}`,
																	fontSize: "0.65rem",
																	padding: "2px 6px",
																	borderRadius: "3px",
																	fontWeight: 800,
																	letterSpacing: "0.04em",
																}}
															>
																{ext}
															</span>
															<span
																style={{
																	fontWeight: 600,
																	color: "var(--text-main)",
																	wordBreak: "break-word",
																}}
															>
																{d.name}
															</span>
															{d.size && (
																<span
																	style={{
																		fontSize: "0.72rem",
																		color: "var(--text-dim)",
																	}}
																>
																	({d.size})
																</span>
															)}
															<a
																onClick={(e) => handleOpenDocument(e, d.url)}
																href={d.url || "#"}
																style={{
																	display: "inline-flex",
																	alignItems: "center",
																	gap: "3px",
																	fontSize: "0.72rem",
																	color: "#3b82f6",
																	textDecoration: "underline",
																	cursor: "pointer",
																	marginLeft: "0.25rem",
																	fontWeight: 500,
																}}
																title="View / Open Document in new tab"
															>
																👁 View
															</a>
														</div>
													</td>
													<td
														style={{
															padding: "0.65rem 0.75rem",
															textAlign: "center",
														}}
													>
														<label
															style={{
																display: "inline-flex",
																alignItems: "center",
																gap: "0.4rem",
																cursor: "pointer",
																userSelect: "none",
																fontSize: "0.76rem",
															}}
														>
															<input
																type="checkbox"
																checked={isSelected}
																onChange={() => handleToggleDoc(idx)}
																style={{
																	cursor: "pointer",
																	width: "16px",
																	height: "16px",
																	accentColor: "#10b981",
																}}
															/>
															<span
																style={{
																	fontWeight: isSelected ? 700 : 500,
																	color: isSelected ? "#10b981" : "var(--text-dim)",
																}}
															>
																{isSelected ? "Selected" : "Select"}
															</span>
														</label>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>

				{/* Evaluation & Approval Form */}
				<form
					onSubmit={handleSubmit}
					style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
				>
					<div className="form-group">
						<label
							htmlFor="sms-review-directives"
							className="form-label"
							style={{
								fontFamily: "serif",
								fontWeight: 600,
								fontSize: "1.1rem",
							}}
						>
							Specialist Verdict & Directives *
						</label>
						<textarea
							id="sms-review-directives"
							className="formal-textarea-control"
							rows="4"
							placeholder="Enter official directives, observations, or instructions (including AI prompts) to the CMS client..."
							value={smsNotes}
							onChange={(e) => setSmsNotes(e.target.value)}
							required
						></textarea>
					</div>

					{/* Form Actions */}
					<div
						style={{
							display: "flex",
							justifyContent: "flex-end",
							alignItems: "center",
							borderTop: "1px solid var(--border-subtle)",
							paddingTop: "1.25rem",
							marginTop: "0.5rem",
						}}
					>
						<button
							type="submit"
							className="formal-btn"
							disabled={loading}
							style={{ padding: "0.85rem 1.75rem", backgroundColor: "#1e3a8a" }}
						>
							{loading ? "Processing..." : "Send this review"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
