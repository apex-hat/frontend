import { useState } from "react";
import LoginPage from "./features/auth/components/LoginPage";
import SignupPage from "./features/auth/components/SignupPage";
import Dashboard from "./features/dashboard/components/Dashboard";
import ProposalPage from "./pages/Proposal/ProposalPage";
import type { AuthUser } from "./types";

type Screen = "login" | "signup" | "dashboard" | "proposals";

/**
 * TODO(백엔드 연동): 실제 세션/토큰 관리와 React Router 경로로 교체.
 * 현재는 통합 기능을 확인할 수 있도록 화면 상태로 이동을 관리합니다.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [user, setUser] = useState<AuthUser | null>(null);

  if (screen === "proposals" && user) {
    return (
      <ProposalPage
        user={user}
        onBackToDashboard={() => setScreen("dashboard")}
      />
    );
  }

  if (screen === "dashboard" && user) {
    return (
      <Dashboard
        user={user}
        onOpenProposals={() => setScreen("proposals")}
        onLogout={() => {
          setUser(null);
          setScreen("login");
        }}
      />
    );
  }

  if (screen === "signup") {
    return (
      <SignupPage
        onSignup={(signedUpUser) => {
          setUser(signedUpUser);
          setScreen("dashboard");
        }}
        onNavigateLogin={() => setScreen("login")}
      />
    );
  }

  return (
    <LoginPage
      onLogin={(loggedInUser) => {
        setUser(loggedInUser);
        setScreen("dashboard");
      }}
      onNavigateSignup={() => setScreen("signup")}
    />
  );
}
