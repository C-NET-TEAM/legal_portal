import { useState } from "react";
import SMSLogin from "./components/Auth/SMSLogin";
import SMSDashboard from "./components/Dashboard/SMSDashboard";

export default function App() {
	const [activeTab, setActiveTab] = useState("dashboard");
	const [smsUser, setSmsUser] = useState(() => {
		try {
			const storedSession = localStorage.getItem("sms_session");
			return storedSession ? JSON.parse(storedSession) : null;
		} catch (err) {
			console.warn("Failed to parse stored sms_session:", err);
			localStorage.removeItem("sms_session");
			return null;
		}
	});
	const [isAuthenticated, setIsAuthenticated] = useState(() => {
		try {
			return Boolean(localStorage.getItem("sms_session"));
		} catch (err) {
			console.warn("Failed to check sms_session auth:", err);
			return false;
		}
	});

	const handleLoginSuccess = (user) => {
		setSmsUser(user);
		setIsAuthenticated(true);
		localStorage.setItem("sms_session", JSON.stringify(user));
	};

	if (!isAuthenticated) {
		return <SMSLogin onLoginSuccess={handleLoginSuccess} />;
	}

	return (
		<div className="sms-layout-formal">
			<main className="sms-main-formal">
				<div className="sms-content-wrapper-formal">
					<SMSDashboard
						activeTab={activeTab}
						setActiveTab={setActiveTab}
						smsUser={smsUser}
					/>
				</div>
			</main>
		</div>
	);
}
