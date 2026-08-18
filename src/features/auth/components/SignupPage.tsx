import { useState } from "react";
import type { FormEvent } from "react";
import AuthLayout from "./AuthLayout";
import type { AuthUser, SupportedLanguage } from "../../../types";
import { getUtcOffsetLabel } from "../../../lib/timezone";
import { signup } from "../../../lib/api";

interface SignupPageProps {
  onSignup: (user: AuthUser) => void;
  onNavigateLogin: () => void;
}

const TIMEZONE_OPTIONS = [
  "Asia/Seoul",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Australia/Sydney",
];

// country는 timezone과 별도 컬럼이므로 가입 시 함께 받는다.
const COUNTRY_OPTIONS = [
  { code: "KR", label: "대한민국" },
  { code: "US", label: "미국" },
  { code: "JP", label: "일본" },
  { code: "IN", label: "인도" },
  { code: "SG", label: "싱가포르" },
  { code: "GB", label: "영국" },
  { code: "DE", label: "독일" },
  { code: "FR", label: "프랑스" },
  { code: "BR", label: "브라질" },
  { code: "AU", label: "호주" },
];

const COUNTRY_TIMEZONE: Record<string, string> = {
  KR: "Asia/Seoul",
  US: "America/New_York",
  JP: "Asia/Tokyo",
  IN: "Asia/Kolkata",
  SG: "Asia/Singapore",
  GB: "Europe/London",
  DE: "Europe/Berlin",
  FR: "Europe/Paris",
  BR: "America/Sao_Paulo",
  AU: "Australia/Sydney",
};

const LANGUAGE_OPTIONS: Array<{ code: SupportedLanguage; label: string }> = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
];

const COUNTRY_LANGUAGE: Record<string, SupportedLanguage> = {
  KR: "ko",
  US: "en",
  JP: "ja",
  IN: "en",
  SG: "en",
  GB: "en",
  DE: "de",
  FR: "en",
  BR: "pt",
  AU: "en",
};

export default function SignupPage({ onSignup, onNavigateLogin }: SignupPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("KR");
  const [timezone, setTimezone] = useState("Asia/Seoul");
  const [language, setLanguage] = useState<SupportedLanguage>("ko");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !country) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      // country/timezone/language는 Backend가 아직 저장할 방법이 없어 signup()에는 전달하지 않는다.
      const user = await signup(name, email, password);
      onSignup(user);
    } catch {
      setError("회원가입에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigateLogin = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    window.setTimeout(onNavigateLogin, 350);
  };

  return (
    <AuthLayout
      eyebrow="회원가입"
      title="팀에 합류하기"
      isNavigating={isNavigating}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-ink-dim mb-1.5" htmlFor="name">
            이름
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-surface border border-surface-3 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-night"
            placeholder="홍길동"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-dim mb-1.5" htmlFor="signup-email">
            이메일
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-surface border border-surface-3 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-night"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-dim mb-1.5" htmlFor="signup-password">
            비밀번호
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-surface border border-surface-3 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-night"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-dim mb-1.5" htmlFor="country">
            국가
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => {
              const nextCountry = e.target.value;
              setCountry(nextCountry);
              setTimezone(COUNTRY_TIMEZONE[nextCountry] ?? "Asia/Seoul");
              setLanguage(COUNTRY_LANGUAGE[nextCountry] ?? "en");
            }}
            className="w-full rounded-lg bg-surface border border-surface-3 px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-night"
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label} ({c.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-dim mb-1.5" htmlFor="language">
            표시 언어
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="w-full rounded-lg bg-surface border border-surface-3 px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-night"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-dim mb-1.5" htmlFor="timezone">
            시간대
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-lg bg-surface border border-surface-3 px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-night"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace("_", " ")} ({getUtcOffsetLabel(tz)})
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-xs text-alert">{error}</p>}

        <div className="pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full cursor-pointer rounded-lg bg-ink text-void font-medium text-sm py-2.5 hover:opacity-90 active:scale-[0.99] transition disabled:cursor-default disabled:opacity-50"
          >
            {isSubmitting ? "생성 중..." : "계정 만들기"}
          </button>
        </div>
      </form>

      <p className="flex items-center justify-center gap-2 text-sm text-ink-dim mt-4 text-center">
        <span>이미 계정이 있으신가요?</span>
        <button
          type="button"
          onClick={handleNavigateLogin}
          disabled={isNavigating}
          className="cursor-pointer text-ink underline underline-offset-4 transition-colors hover:text-night"
        >
          로그인
        </button>
      </p>
    </AuthLayout>
  );
}
