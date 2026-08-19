import { useEffect, useState, type FormEvent } from "react";
import type { AuthUser, Notification, SupportedLanguage } from "../../../types";
import { getUtcOffsetLabel } from "../../../lib/timezone";
import { getNotifications, markNotificationRead } from "../../../lib/api";
import { copyToClipboard } from "../../../lib/clipboard";
import UserHandleButton from "../../workspace/components/UserHandleButton";
import BrandMark from "../../../components/branding/BrandMark";
import NotificationPanel from "../../dashboard/components/NotificationPanel";
import ConnectionButton from "../../workspace/components/ConnectionButton";
import FriendManagerModal from "../../workspace/components/FriendManagerModal";
import { useTeamSwitcher } from "../../workspace/useTeamSwitcher";

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnectionManagerOpen, setIsConnectionManagerOpen] = useState(false);
  const userHandle = user.friend_code ? `#${user.friend_code}` : "";
  const { selectedTeamId } = useTeamSwitcher(user);

  useEffect(() => {
    let cancelled = false;
    getNotifications().then((list) => {
      if (!cancelled) setNotifications(list);
    });
    return () => { cancelled = true; };
  }, []);

  const markAllRead = () => {
    const unreadIds = notifications.filter((notification) => !notification.is_read).map((notification) => notification.id);
    setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
    unreadIds.forEach((id) => markNotificationRead(id));
  };

  const markRead = (notification: Notification) => {
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
    markNotificationRead(notification.id);
  };

  const selectNotification = (notification: Notification) => {
    markRead(notification);
    if (notification.type === "FRIEND_REQUEST") setIsConnectionManagerOpen(true);
    else onBack();
  };

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
        <div className="flex w-full items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <button type="button" onClick={onBack} className="font-display text-lg text-ink">
              Meridian
            </button>
          </div>
          <div className="flex items-center gap-3">
            <NotificationPanel notifications={notifications} onMarkAllRead={markAllRead} onMarkRead={markRead} onSelect={selectNotification} />
            <ConnectionButton onClick={() => setIsConnectionManagerOpen(true)} />
            <div className="flex items-center border-l border-surface-3 pl-3">
              <UserHandleButton user={user} onLogout={onLogout} />
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 pb-10">
        <div className="-mx-2 flex py-3">
          <button type="button" onClick={onBack} aria-label="대시보드로 돌아가기" className="flex h-8 w-8 items-center justify-center text-ink-dim transition hover:text-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>
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
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div>
                <label htmlFor="profile-name" className="mb-1.5 block text-xs text-ink-dim">이름</label>
                <input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-surface-3 bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-night"
                />
              </div>
              <div className="flex gap-1.5">
                  <input id="profile-handle" aria-label="고유 ID" value={userHandle} readOnly className="w-24 cursor-default rounded-lg border border-surface-3 bg-void/40 px-2.5 py-2.5 font-mono text-[11px] text-ink-faint" />
                  <button
                    type="button"
                    onClick={async () => {
                      const copied = await copyToClipboard(userHandle);
                      if (copied) {
                        setTagCopied(true);
                        window.setTimeout(() => setTagCopied(false), 1200);
                      }
                    }}
                    title="친구 추가에 사용할 고유 ID 복사"
                    className="rounded-lg border border-surface-3 px-2.5 text-xs text-ink-dim hover:text-ink"
                  >
                    {tagCopied ? "완료" : "복사"}
                  </button>
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
      <FriendManagerModal open={isConnectionManagerOpen} onClose={() => setIsConnectionManagerOpen(false)} teamId={selectedTeamId} />
    </div>
  );
}
