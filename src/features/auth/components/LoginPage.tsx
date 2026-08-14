import { useState } from "react";
import type { FormEvent } from "react";
import AuthLayout from "./AuthLayout";
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

  return (
    <AuthLayout
      eyebrow="안녕하세요"
      title="로그인"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-ink text-void font-medium text-sm py-2.5 mt-2 hover:opacity-90 transition disabled:opacity-50"
        >
          {isSubmitting ? "확인 중..." : "로그인"}
        </button>
      </form>

      <p className="flex items-center justify-center gap-2 text-sm text-ink-dim mt-6 text-center">
        <span>아직 계정이 없으신가요?</span>
        <button
          type="button"
          onClick={onNavigateSignup}
          className="cursor-pointer text-ink underline underline-offset-4 transition-all hover:text-night active:scale-95"
        >
          회원가입
        </button>
      </p>
    </AuthLayout>
  );
}
