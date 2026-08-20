import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LoginPage from "./features/auth/components/LoginPage";
import SignupPage from "./features/auth/components/SignupPage";
import Dashboard from "./features/dashboard/components/Dashboard";
import ProfilePage from "./features/profile/components/ProfilePage";
import ProposalPage from "./pages/Proposal/ProposalPage";
import { auth } from "./lib/firebase";
import type { AuthUser } from "./types";

const AUTH_STORAGE_KEY = "meridian.auth-user";

function readStoredUser(): AuthUser | null {
  try {
    const stored = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;

    const user = JSON.parse(stored) as Partial<AuthUser>;
    // id/name/email은 Backend가 JIT 동기화 시 항상 채우지만, country/timezone/culture_tag는
    // 온보딩(PATCH /api/users/me)을 거치기 전까지 비어있을 수 있다 — 그것 때문에 세션을
    // 무효화하면 새로고침할 때마다 로그아웃되므로 이 셋은 필수로 요구하지 않는다.
    if (!user.id || !user.name || !user.email) {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return {
      ...user,
      country: user.country ?? "",
      timezone: user.timezone ?? "UTC",
      culture_tag: user.culture_tag ?? "",
      preferred_language: user.preferred_language ?? "ko",
      friend_code: user.friend_code ?? "",
    } as AuthUser;
  } catch {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  // sessionStorage 캐시는 UI 표시용일 뿐, 실제 인증 상태의 원천은 Firebase다.
  // 캐시는 남아있는데 Firebase 세션이 끊긴 경우(예: 스토리지 접근 제한, 세션 만료)를 그대로 두면
  // 화면은 로그인된 것처럼 보이면서 모든 API 요청이 토큰 없이 401을 받는 상태가 된다.
  // Firebase가 로그아웃 상태를 보고하면 캐시를 지우고 로그인 화면으로 되돌린다.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  const completeAuth = (authenticatedUser: AuthUser) => {
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    navigate("/dashboard", { replace: true });
  };

  const logout = () => {
    void signOut(auth);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    navigate("/login", { replace: true });
  };

  const updateProfile = (updatedUser: AuthUser) => {
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
    navigate("/dashboard");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage
              onLogin={completeAuth}
              onNavigateSignup={() => navigate("/signup")}
            />
          )
        }
      />
      <Route
        path="/signup"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <SignupPage
              onSignup={completeAuth}
              onNavigateLogin={() => navigate("/login")}
            />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          user ? (
            <Dashboard
              user={user}
              onCreateProposal={() => navigate("/proposals/new")}
              onOpenProposal={(proposalId) => navigate(`/proposals/${proposalId}/opinions`)}
              onEditProposal={(proposalId) => navigate(`/proposals/${proposalId}/edit`)}
              onViewProposal={(proposalId) => navigate(`/proposals/${proposalId}/detail`)}
              onOpenProfile={() => navigate("/profile")}
              onLogout={logout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/profile"
        element={
          user ? (
            <ProfilePage
              user={user}
              onSave={updateProfile}
              onBack={() => navigate("/dashboard")}
              onLogout={logout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/proposals/*"
        element={
          user ? (
            <ProposalPage
              user={user}
              onBackToDashboard={() => navigate("/dashboard")}
              onOpenProfile={() => navigate("/profile")}
              onLogout={logout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}
