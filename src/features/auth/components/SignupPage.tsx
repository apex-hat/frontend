import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import AuthLayout from "./AuthLayout";
import type { AuthUser } from "../../../types";
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

export default function SignupPage({ onSignup, onNavigateLogin }: SignupPageProps) {
  const detectedTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "Asia/Seoul";
    }
  }, []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("KR");
  const [timezone, setTimezone] = useState(
    TIMEZONE_OPTIONS.includes(detectedTz) ? detectedTz : "Asia/Seoul"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      const user = await signup(name, email, password, country, timezone);
      onSignup(user);
    } catch {
      setError("회원가입에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="회원가입"
      title="팀에 합류하기"
      subtitle="시간대를 등록하면 동료들이 여러분의 근무 시간을 바로 알 수 있어요."
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
            onChange={(e) => setCountry(e.target.value)}
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
          <p className="text-xs text-ink-faint mt-1.5">브라우저 기준으로 자동 감지했어요. 필요하면 변경하세요.</p>
        </div>

        {error && <p className="text-xs text-alert">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-ink text-void font-medium text-sm py-2.5 mt-2 hover:opacity-90 transition disabled:opacity-50"
        >
          {isSubmitting ? "생성 중..." : "계정 만들기"}
        </button>
      </form>

      <p className="text-sm text-ink-dim mt-6 text-center">
        이미 계정이 있으신가요?{" "}
        <button onClick={onNavigateLogin} className="text-ink underline underline-offset-4">
          로그인
        </button>
      </p>
    </AuthLayout>
  );
}
