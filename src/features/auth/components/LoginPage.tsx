import { useState } from "react";
import type { FormEvent } from "react";
import AuthLayout from "./AuthLayout";
import RotatingGreeting from "./RotatingGreeting";
import type { AuthUser } from "../../../types";
import { login } from "../../../lib/api";

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
  onNavigateSignup: () => void;
}

export default function LoginPage({ onLogin, onNavigateSignup }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      onLogin(user);
    } catch {
      setError("로그인에 실패했어요. 이메일과 비밀번호를 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigateSignup = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    window.setTimeout(onNavigateSignup, 350);
  };

  return (
    <AuthLayout
      eyebrow="로그인"
      title={<RotatingGreeting />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-ink-dim mb-1.5" htmlFor="email">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-surface border border-surface-3 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-night"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-dim mb-1.5" htmlFor="password">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-surface border border-surface-3 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-night"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-xs text-alert">{error}</p>}

        <div className="pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full cursor-pointer rounded-lg bg-ink text-void font-medium text-sm py-2.5 hover:opacity-90 active:scale-[0.99] transition disabled:cursor-default disabled:opacity-50"
          >
            {isSubmitting ? "확인 중..." : "로그인"}
          </button>
        </div>
      </form>

      <p className="flex items-center justify-center gap-2 text-sm text-ink-dim mt-6 text-center">
        <span>아직 계정이 없으신가요?</span>
        <button
          type="button"
          onClick={handleNavigateSignup}
          disabled={isNavigating}
          className="min-w-[3.5rem] cursor-pointer text-ink underline underline-offset-4 transition-all hover:text-night active:scale-95 disabled:cursor-wait disabled:text-ink-dim"
        >
          {isNavigating ? "이동 중..." : "회원가입"}
        </button>
      </p>
    </AuthLayout>
  );
}
