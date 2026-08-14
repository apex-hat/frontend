import { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LoginPage from "./features/auth/components/LoginPage";
import SignupPage from "./features/auth/components/SignupPage";
import Dashboard from "./features/dashboard/components/Dashboard";
import ProfilePage from "./features/profile/components/ProfilePage";
import GroupInvitePage from "./features/workspace/components/GroupInvitePage";
import ProposalPage from "./pages/Proposal/ProposalPage";
import type { AuthUser } from "./types";

const AUTH_STORAGE_KEY = "meridian.auth-user";

function readStoredUser(): AuthUser | null {
  try {
    const stored = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;

    const user = JSON.parse(stored) as Partial<AuthUser>;
    if (!user.id || !user.name || !user.email || !user.country || !user.timezone || !user.culture_tag) {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return {
      ...user,
      preferred_language: user.preferred_language ?? "ko",
    } as AuthUser;
  } catch {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const completeAuth = (authenticatedUser: AuthUser) => {
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    navigate("/dashboard", { replace: true });
  };

  const logout = () => {
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
        path="/invite/:inviteCode"
        element={
          user ? (
            <GroupInvitePage user={user} onComplete={() => navigate("/dashboard")} />
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
