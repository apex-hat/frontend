import { useState, type FormEvent } from "react";
import type { AuthUser, SupportedLanguage } from "../../../types";
import { getUtcOffsetLabel } from "../../../lib/timezone";
import BackButton from "../../../components/navigation/BackButton";
import UserHandleButton from "../../workspace/components/UserHandleButton";
import { getUserHandle } from "../../workspace/workspaceStorage";

interface ProfilePageProps {
  user: AuthUser;
  onSave: (user: AuthUser) => void;
  onBack: () => void;
  onLogout: () => void;
}

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

export default function ProfilePage({ user, onSave, onBack, onLogout }: ProfilePageProps) {
  const [name, setName] = useState(user.name);
  const [country, setCountry] = useState(user.country);
  const [timezone, setTimezone] = useState(user.timezone);
  const [language, setLanguage] = useState<SupportedLanguage>(user.preferred_language);
  const [tagCopied, setTagCopied] = useState(false);
  const userHandle = getUserHandle(user);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onSave({
      ...user,
      name: trimmedName,
      country,
      timezone,
      preferred_language: language,
    });
  };

  return (
    <div className="min-h-screen bg-void">
      <header className="sticky top-0 z-30 border-b border-surface-3 bg-void/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BackButton onClick={onBack} />
            <button type="button" onClick={onBack} className="font-display text-lg text-ink">
              Meridian
            </button>
          </div>
          <div className="flex items-center gap-2">
            <UserHandleButton user={user} />
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-surface-3 px-3 py-1.5 text-xs text-ink-dim transition-colors hover:text-ink"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 py-10">
        <div className="mx-auto max-w-lg">
        <section className="rounded-2xl border border-surface-3 bg-surface p-6 sm:p-8">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-day text-sm font-semibold text-void">
              {name.trim().slice(0, 1) || user.name.slice(0, 1)}
            </div>
            <div>
              <h1 className="font-display text-xl text-ink">내정보</h1>
              <p className="mt-0.5 text-xs text-ink-faint">지역과 표시 언어를 관리하세요.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr]">
              <div>
                <label htmlFor="profile-name" className="mb-1.5 block text-xs text-ink-dim">이름</label>
                <input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-surface-3 bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-night"
                />
              </div>
              <div>
                <label htmlFor="profile-handle" className="mb-1.5 block text-xs text-ink-dim">고유 ID</label>
                <div className="flex gap-1.5">
                  <input id="profile-handle" value={userHandle} readOnly className="min-w-0 flex-1 cursor-default rounded-lg border border-surface-3 bg-void/40 px-3 py-2.5 font-mono text-xs text-ink-faint" />
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(`${name.trim() || user.name} ${userHandle}`);
                      setTagCopied(true);
                      window.setTimeout(() => setTagCopied(false), 1200);
                    }}
                    title="친구 추가에 사용할 고유 ID 복사"
                    className="rounded-lg border border-surface-3 px-2.5 text-xs text-ink-dim hover:text-ink"
                  >
                    {tagCopied ? "완료" : "복사"}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="profile-email" className="mb-1.5 block text-xs text-ink-dim">이메일</label>
              <input
                id="profile-email"
                value={user.email}
                readOnly
                className="w-full cursor-default rounded-lg border border-surface-3 bg-void/40 px-3.5 py-2.5 text-sm text-ink-faint"
              />
            </div>

            <div>
              <label htmlFor="profile-country" className="mb-1.5 block text-xs text-ink-dim">국가</label>
              <select
                id="profile-country"
                value={country}
                onChange={(event) => {
                  const nextCountry = event.target.value;
                  setCountry(nextCountry);
                  setTimezone(COUNTRY_TIMEZONE[nextCountry] ?? timezone);
                  setLanguage(COUNTRY_LANGUAGE[nextCountry] ?? language);
                }}
                className="w-full rounded-lg border border-surface-3 bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-night"
              >
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="profile-timezone" className="mb-1.5 block text-xs text-ink-dim">시간대</label>
              <select
                id="profile-timezone"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="w-full rounded-lg border border-surface-3 bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-night"
              >
                {TIMEZONE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll("_", " ")} ({getUtcOffsetLabel(option)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="profile-language" className="mb-1.5 block text-xs text-ink-dim">표시 언어</label>
              <select
                id="profile-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value as SupportedLanguage)}
                className="w-full rounded-lg border border-surface-3 bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-night"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>{option.label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="mt-3 w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-void transition hover:opacity-90 active:scale-[0.99]"
            >
              변경사항 저장
            </button>
          </form>
        </section>
        </div>
      </main>
    </div>
  );
}
