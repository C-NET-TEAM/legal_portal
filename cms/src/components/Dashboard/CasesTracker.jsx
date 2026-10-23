import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import { CASE_STATUS } from "../../constants/caseStatus";
import CaseTimelineModal from "./CaseTimelineModal";

export default function CasesTracker({ user }) {
	const [cases, setCases] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("PENDING");

	const [viewTimelineCase, setViewTimelineCase] = useState(null);
	const [alerts, setAlerts] = useState([]);

	const loadData = useCallback(async () => {
		try {
			const currentClientId = user?.clientId;
			const [casesRes, alertsRes] = await Promise.all([
				api.getCases(currentClientId),
				api.getAlerts().catch(() => []),
			]);
			setCases(casesRes || []);
			setAlerts(alertsRes || []);
		} catch (err) {
			console.error("Error polling data:", err);
		} finally {
			setLoading(false);
		}
	}, [user]);

	const caseHasUnreadReply = (caseItem) => {
		// 1. Has unread alert for this case
		const hasUnreadAlert = alerts.some(
			(a) => !a.read && a.caseId === caseItem.id,
		);
		if (hasUnreadAlert) return true;

		// 2. Has chat message from SMS that has not been read by CMS
		if (
			caseItem.chats?.some(
				(ch) => ch.sender === "sms" && ch.readByCms === false,
			)
		) {
			return true;
		}
		return false;
	};

	const underReviewUnreadCount = cases.filter(
		(c) =>
			(c.status === "Approved" || c.status === "AI Output Submitted") &&
			caseHasUnreadReply(c),
	).length;

	const handleOpenCase = async (caseItem) => {
		setViewTimelineCase(caseItem);
		if (caseHasUnreadReply(caseItem)) {
			try {
				await api.markCaseRead(caseItem.id);
				// Optimistically clear alerts and unread status
				setAlerts((prev) =>
					prev.map((a) =>
						a.caseId === caseItem.id ? { ...a, read: true } : a,
					),
				);
				setCases((prev) =>
					prev.map((item) => {
						if (item.id === caseItem.id && item.chats) {
							return {
								...item,
								chats: item.chats.map((ch) =>
									ch.sender === "sms" ? { ...ch, readByCms: true } : ch,
								),
							};
						}
						return item;
					}),
				);
			} catch (err) {
				console.error("Error marking case as read:", err);
			}
		}
	};

	const [deletingCaseId, setDeletingCaseId] = useState(null);

	const handleDeleteCase = async (caseItem, e) => {
		if (e) e.stopPropagation();
		if (!caseItem?.id) return;

		const confirmed = window.confirm(
			`Are you sure you want to delete this case?\n\nCase ID: ${caseItem.id}\nClient: ${caseItem.clientName || "N/A"}\n\nThis action cannot be undone.`,
		);

		if (!confirmed) return;

		try {
			setDeletingCaseId(caseItem.id);
			await api.deleteCase(caseItem.id, user?.clientId);
			setCases((prev) => prev.filter((c) => c.id !== caseItem.id));
			setAlerts((prev) => prev.filter((a) => a.caseId !== caseItem.id));
			if (viewTimelineCase && viewTimelineCase.id === caseItem.id) {
				setViewTimelineCase(null);
			}
		} catch (err) {
			console.error("Error deleting case:", err);
			alert(`Failed to delete case: ${err.message}`);
		} finally {
			setDeletingCaseId(null);
		}
	};

	const formatDateDMY = (dateStr) => {
		if (!dateStr) return "";
		const d = new Date(dateStr);
		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0");
		return `${day}/${month}/${d.getFullYear()}`;
	};

	useEffect(() => {
		let active = true;
		const fetchData = async () => {
			try {
				const currentClientId = user?.clientId;
				const [casesRes, alertsRes] = await Promise.all([
					api.getCases(currentClientId),
					api.getAlerts().catch(() => []),
				]);
				if (active) {
					setCases(casesRes || []);
					setAlerts(alertsRes || []);
					setLoading(false);
				}
			} catch (err) {
				console.error("Error polling data:", err);
				if (active) {
					setLoading(false);
				}
			}
		};

		fetchData();
		const interval = setInterval(fetchData, 2500); // Live sync every 2.5 seconds
		return () => {
			active = false;
			clearInterval(interval);
		};
	}, [user]);

	const filteredCases = cases.filter((c) => {
		const matchesSearch =
			(c.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
			(c.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
			(c.city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
			(c.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
			(c.details || "").toLowerCase().includes(searchTerm.toLowerCase());

		if (statusFilter === "PENDING")
			return matchesSearch && c.status === "Pending";
		if (statusFilter === "UNDER REVIEW")
			return (
				matchesSearch &&
				(c.status === "Approved" || c.status === "AI Output Submitted")
			);
		if (statusFilter === "COMPLETED")
			return matchesSearch && c.status === "Completed";
		return matchesSearch;
	});

	if (loading && cases.length === 0) {
		return (
			<div
				style={{
					padding: "2rem",
					textAlign: "center",
					color: "var(--text-muted)",
				}}
			>
				Loading Cases Tracker...
			</div>
		);
	}

	return (
		<div style={{ maxWidth: "1100px", margin: "0 auto" }}>
			<div className="glass-box" style={{ padding: "1.75rem 2rem" }}>
				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "space-between",
						alignItems: "center",
						gap: "1rem",
						borderBottom: "1px solid var(--border-subtle)",
						paddingBottom: "1rem",
						marginBottom: "1.5rem",
					}}
				>
					<div>
						<h2
							style={{
								fontSize: "1.35rem",
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
							}}
						>
							<svg
								width="22"
								height="22"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<title>Search</title>
								<circle cx="11" cy="11" r="8"></circle>
								<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
							</svg>{" "}
							Old Cases Search & Process Tracker
						</h2>
						<div
							style={{
								fontSize: "0.82rem",
								color: "var(--text-dim)",
								marginTop: "0.2rem",
							}}
						>
							Track current progress, review history, and legal documentation
							stages
						</div>
					</div>

					{/* Search Bar */}
					<div className="cases-search-container">
						<input
							type="text"
							className="input-control"
							placeholder="Search by ID, Name, City..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							style={{
								padding: "0.6rem 0.85rem",
								fontSize: "0.88rem",
								width: "100%",
							}}
						/>
					</div>
				</div>

				{/* Filter Pills */}
				<div
					style={{
						display: "flex",
						gap: "0.5rem",
						marginBottom: "1.25rem",
						overflowX: "auto",
						paddingBottom: "0.25rem",
					}}
				>
					{["PENDING", "UNDER REVIEW", "COMPLETED"].map((status) => (
						<button
							key={status}
							type="button"
							className="btn"
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: "0.45rem",
								padding: "0.4rem 0.85rem",
								fontSize: "0.78rem",
								background:
									statusFilter === status
										? "var(--primary)"
										: "rgba(255,255,255,0.03)",
								color: statusFilter === status ? "#fff" : "var(--text-muted)",
								border: "1px solid var(--border-subtle)",
							}}
							onClick={() => setStatusFilter(status)}
						>
							<span>{status}</span>
							{status === "UNDER REVIEW" && underReviewUnreadCount > 0 && (
								<span
									style={{
										background: "#ef4444",
										color: "#ffffff",
										fontSize: "0.68rem",
										fontWeight: 800,
										padding: "1px 6px",
										borderRadius: "9999px",
										lineHeight: "1.2",
										boxShadow: "0 0 6px rgba(239, 68, 68, 0.5)",
									}}
								>
									{underReviewUnreadCount}
								</span>
							)}
						</button>
					))}
				</div>

				{/* Cases List */}
				{filteredCases.length === 0 ? (
					<div
						style={{
							textAlign: "center",
							padding: "4rem 1rem",
							color: "var(--text-dim)",
							background: "rgba(255,255,255,0.02)",
							borderRadius: "var(--radius-lg)",
							border: "1px dashed var(--border-subtle)",
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "center",
								marginBottom: "1rem",
								color: "var(--text-muted)",
							}}
						>
							<svg
								width="64"
								height="64"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1"
								strokeLinecap="round"
								strokeLinejoin="round"
								style={{ opacity: 0.6 }}
							>
								<title>No Cases Found</title>
								<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
								<path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
							</svg>
						</div>
						<div
							style={{
								fontSize: "1.1rem",
								fontWeight: 500,
								color: "var(--text-muted)",
							}}
						>
							No cases found matching your criteria.
						</div>
					</div>
				) : (
					<div
						style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
					>
						{filteredCases.map((c) => (
							<div
								key={c.id}
								className="glass-box"
								onClick={() => handleOpenCase(c)}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										handleOpenCase(c);
									}
								}}
								style={{
									display: "flex",
									flexDirection: "column",
									padding: "0.85rem 1rem",
									borderLeft: "4px solid",
									borderLeftColor:
										c.status === CASE_STATUS.PENDING
											? "#f59e0b"
											: c.status === CASE_STATUS.AI_OUTPUT_SUBMITTED
												? "#8b5cf6"
												: c.status === CASE_STATUS.APPROVED
													? "#10b981"
													: c.status === CASE_STATUS.COMPLETED ||
															c.status?.trim().toLowerCase() === "completed"
														? "#22d3ee"
														: "var(--text-dim)",
									background: "var(--surface)",
									boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
									transition: "all 0.2s ease",
									cursor: "pointer",
									width: "100%",
									textAlign: "left",
									fontFamily: "inherit",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.transform = "translateY(-1px)")
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.transform = "translateY(0)")
								}
							>
								{/* Header line */}
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										gap: "0.75rem",
										flexWrap: "wrap",
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "0.65rem",
											flexWrap: "wrap",
										}}
									>
										<span
											style={{
												fontWeight: 700,
												fontSize: "0.95rem",
												color: "var(--primary)",
											}}
										>
											{c.id}
										</span>
										<span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
											{c.title ? `${c.title} ` : ""}{c.clientName}
										</span>
										<span
											style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}
										>
											{c.clientType ? `[${c.clientType}] ` : (c.age || c.sex ? `(${[c.age, c.sex].filter(Boolean).join(", ")}) ` : "")}
											| {c.city || "N/A"}, {c.state || "N/A"} |{" "}
											{formatDateDMY(c.createdAt)}
										</span>
										{c.category && (
											<span
												style={{
													fontSize: "0.7rem",
													background: "rgba(6, 182, 212, 0.1)",
													color: "var(--accent-cyan)",
													border: "1px solid rgba(6, 182, 212, 0.2)",
													padding: "1px 6px",
													borderRadius: "4px",
													fontWeight: 600,
												}}
											>
												{c.category}
											</span>
										)}
										{c.caseKeywords && (
											<span
												style={{
													fontSize: "0.7rem",
													background: "rgba(168, 85, 247, 0.1)",
													color: "#a855f7",
													border: "1px solid rgba(168, 85, 247, 0.2)",
													padding: "1px 6px",
													borderRadius: "4px",
													fontWeight: 600,
												}}
											>
												{c.caseKeywords}
											</span>
										)}
									</div>

									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "0.5rem",
										}}
									>
										{caseHasUnreadReply(c) && (
											<span
												style={{
													background: "rgba(239, 68, 68, 0.12)",
													color: "#ef4444",
													border: "1px solid rgba(239, 68, 68, 0.3)",
													padding: "2px 7px",
													borderRadius: "4px",
													fontSize: "0.68rem",
													fontWeight: 700,
													display: "inline-flex",
													alignItems: "center",
													gap: "0.35rem",
												}}
											>
												<span
													style={{
														width: "6px",
														height: "6px",
														borderRadius: "50%",
														background: "#ef4444",
													}}
												></span>
												New SMS Reply
											</span>
										)}
										<span
											className={`badge ${
												c.status === "Approved"
													? "badge-approved"
													: c.status === "AI Output Submitted"
														? "badge-ai"
														: c.status === "Completed"
															? "badge-completed"
															: "badge-pending"
											}`}
											style={{ padding: "0.2rem 0.5rem", fontSize: "0.65rem" }}
										>
											{c.status === "Approved"
												? "Under Review"
												: c.status === "AI Output Submitted"
													? "SMS Review Pending"
													: c.status}
										</span>

										<button
											type="button"
											onClick={(e) => handleDeleteCase(c, e)}
											disabled={deletingCaseId === c.id}
											title={`Delete Case ${c.id}`}
											style={{
												background: "rgba(239, 68, 68, 0.08)",
												border: "1px solid rgba(239, 68, 68, 0.25)",
												color: "#ef4444",
												borderRadius: "5px",
												padding: "0.2rem 0.55rem",
												fontSize: "0.72rem",
												fontWeight: 600,
												display: "inline-flex",
												alignItems: "center",
												gap: "0.3rem",
												cursor: deletingCaseId === c.id ? "not-allowed" : "pointer",
												transition: "all 0.15s ease",
											}}
											onMouseEnter={(e) => {
												if (deletingCaseId !== c.id) {
													e.currentTarget.style.background = "#ef4444";
													e.currentTarget.style.color = "#ffffff";
												}
											}}
											onMouseLeave={(e) => {
												if (deletingCaseId !== c.id) {
													e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
													e.currentTarget.style.color = "#ef4444";
												}
											}}
										>
											<svg
												width="12"
												height="12"
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
											{deletingCaseId === c.id ? "Deleting..." : "Delete"}
										</button>
									</div>
								</div>

								{/* Case Details preview - 1 line truncated */}
								<p
									style={{
										fontSize: "0.8rem",
										color: "var(--text-muted)",
										margin: "0.4rem 0",
										whiteSpace: "nowrap",
										overflow: "hidden",
										textOverflow: "ellipsis",
									}}
								>
									{c.details}
								</p>

								{/* Footer Line: Documents & Specialist */}
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										marginTop: "0.25rem",
									}}
								>
									{/* Documents */}
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "0.5rem",
										}}
									>
										{c.documents && c.documents.length > 0 ? (
											<span
												style={{
													display: "inline-flex",
													alignItems: "center",
													gap: "0.35rem",
													fontSize: "0.72rem",
													color: "var(--text-dim)",
													fontWeight: 600,
												}}
											>
												<svg
													width="13"
													height="13"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<title>Attached Document</title>
													<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
													<polyline points="14 2 14 8 20 8"></polyline>
													<line x1="16" y1="13" x2="8" y2="13"></line>
													<line x1="16" y1="17" x2="8" y2="17"></line>
													<polyline points="10 9 9 9 8 9"></polyline>
												</svg>
												{c.documents.length} Attached{" "}
												{c.documents.length === 1 ? "Document" : "Documents"}
											</span>
										) : (
											<span
												style={{
													display: "inline-flex",
													alignItems: "center",
													gap: "0.35rem",
													fontSize: "0.72rem",
													color: "var(--text-dim)",
												}}
											>
												<svg
													width="13"
													height="13"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
													style={{ opacity: 0.6 }}
												>
													<title>No Documents</title>
													<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
													<polyline points="14 2 14 8 20 8"></polyline>
													<line x1="16" y1="13" x2="8" y2="13"></line>
													<line x1="16" y1="17" x2="8" y2="17"></line>
													<polyline points="10 9 9 9 8 9"></polyline>
												</svg>
												No attached documents
											</span>
										)}
									</div>

									{/* SMS Specialist Badge Compact */}
									{c.reviewerInfo && (
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "0.4rem",
												background: "#f8fafc",
												padding: "0.2rem 0.5rem",
												borderRadius: "4px",
												border: "1px solid #e2e8f0",
											}}
										>
											<div
												style={{
													width: "18px",
													height: "18px",
													borderRadius: "50%",
													background: "#3b82f6",
													color: "#fff",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													fontSize: "0.6rem",
													fontWeight: "bold",
												}}
											>
												{c.reviewerInfo.profileImage ? (
													<img
														src={c.reviewerInfo.profileImage}
														alt=""
														style={{
															width: "100%",
															height: "100%",
															borderRadius: "50%",
															objectFit: "cover",
														}}
													/>
												) : (
													c.reviewerInfo.name.charAt(0)
												)}
											</div>
											<span
												style={{
													fontSize: "0.7rem",
													color: "#334155",
													fontWeight: 600,
												}}
											>
												{c.reviewerInfo.name}
											</span>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
			{viewTimelineCase && (
				<CaseTimelineModal
					caseItem={
						cases.find((c) => c.id === viewTimelineCase.id) || viewTimelineCase
					}
					userRole="cms"
					currentUser={user}
					onRefresh={loadData}
					onClose={() => setViewTimelineCase(null)}
					onDeleteCase={handleDeleteCase}
				/>
			)}
		</div>
	);
}
