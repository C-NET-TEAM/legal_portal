const DEFAULT_API_BASE = "http://localhost:5000/api";

export const getApiBase = () => {
	const stored = localStorage.getItem("cms_api_url");
	if (stored && stored.includes("sslip.io")) {
		localStorage.removeItem("cms_api_url");
	}
	return (
		localStorage.getItem("cms_api_url") ||
		import.meta.env.VITE_API_URL ||
		DEFAULT_API_BASE
	);
};

export const api = {
	// Auth
	async register(clientId, name, password) {
		const API_BASE = getApiBase();
		const res = await fetch(`${API_BASE}/auth/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ clientId, name, password }),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Registration failed");
		return data;
	},

	async login(clientId, password) {
		const API_BASE = getApiBase();
		const res = await fetch(`${API_BASE}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ clientId, password }),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Login failed");
		return data;
	},

	async changePassword(clientId, oldPassword, newPassword) {
		const API_BASE = getApiBase();
		const res = await fetch(`${API_BASE}/auth/change-password`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ clientId, oldPassword, newPassword }),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Password change failed");
		return data;
	},

	async forgotPassword(clientId, newPassword) {
		const API_BASE = getApiBase();
		const res = await fetch(`${API_BASE}/auth/forgot-password`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ clientId, newPassword }),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Password reset failed");
		return data;
	},

	// Cases
	async getCases(clientId) {
		const API_BASE = getApiBase();
		const url = clientId
			? `${API_BASE}/cases?clientId=${encodeURIComponent(clientId)}`
			: `${API_BASE}/cases`;
		const res = await fetch(url);
		if (!res.ok) throw new Error("Failed to load cases");
		return await res.json();
	},

	async createCase(caseData) {
		const API_BASE = getApiBase();
		const res = await fetch(`${API_BASE}/cases`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(caseData),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Failed to submit case");
		return data;
	},

	async deleteCase(caseId, clientId) {
		const API_BASE = getApiBase();
		const headers = { "Content-Type": "application/json" };
		if (clientId) {
			headers["x-client-id"] = clientId;
		}
		const res = await fetch(`${API_BASE}/cases/${caseId}`, {
			method: "DELETE",
			headers,
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Failed to delete case");
		return data;
	},

	async addChatMessage(caseId, sender, text, documents, phase) {
		const API_BASE = getApiBase();
		const res = await fetch(`${API_BASE}/cases/${caseId}/chat`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sender, text, documents, phase }),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Failed to send chat message");
		return data;
	},

	async editChatMessage(caseId, phase, sender, text, documents) {
		const API_BASE = getApiBase();
		const res = await fetch(`${API_BASE}/cases/${caseId}/chat`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ phase, sender, text, documents }),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Failed to edit chat message");
		return data;
	},

	async handleReviewAction(caseId, action, sender, note) {
		const API_BASE = getApiBase();
		const res = await fetch(`${API_BASE}/cases/${caseId}/review-action`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action, sender, note }),
		});
		const data = await res.json();
		if (!res.ok)
			throw new Error(data.error || "Failed to process review action");
		return data;
	},

	// Alerts
	async getAlerts() {
		const API_BASE = getApiBase();
		const res = await fetch(`${API_BASE}/alerts`);
		if (!res.ok) throw new Error("Failed to load alerts");
		return await res.json();
	},

	async markAlertRead(alertId) {
		const API_BASE = getApiBase();
		const res = await fetch(`${API_BASE}/alerts/${alertId}/read`, {
			method: "POST",
		});
		return await res.json();
	},

	async markAllAlertsRead() {
		const API_BASE = getApiBase();
		const res = await fetch(`${API_BASE}/alerts/mark-all-read`, {
			method: "POST",
		});
		return await res.json();
	},

	async markCaseRead(caseId) {
		const API_BASE = getApiBase();
		const res = await fetch(`${API_BASE}/cases/${caseId}/mark-read`, {
			method: "POST",
		});
		return await res.json();
	},
};
