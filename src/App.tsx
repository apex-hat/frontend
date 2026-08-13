import { useState } from "react";
import LoginPage from "./features/auth/components/LoginPage";
import SignupPage from "./features/auth/components/SignupPage";
import Dashboard from "./features/dashboard/components/Dashboard";
import type { AuthUser } from "./types";

type Screen = "login" | "signup" | "dashboard";

/**
 * TODO(백엔드 연동): 실제 세션/토큰 관리(예: httpOnly 쿠키, localStorage 토큰)로 교체.
 * 지금은 화면 전환만 담당하는 최소한의 상태머신입니다.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [user, setUser] = useState<AuthUser | null>(null);

  if (screen === "dashboard" && user) {
    return (
      <Dashboard
        user={user}
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
        onSignup={(u) => {
          setUser(u);
          setScreen("dashboard");
        }}
        onNavigateLogin={() => setScreen("login")}
      />
    );
  }

  return (
    <LoginPage
      onLogin={(u) => {
        setUser(u);
        setScreen("dashboard");
      }}
      onNavigateSignup={() => setScreen("signup")}
    />
  );
}
