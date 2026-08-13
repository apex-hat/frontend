import { useEffect, useRef, useState } from "react";
import type { Notification, NotificationType } from "../../../types";

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onSelect: (notification: Notification) => void;
}

const TYPE_ICON: Record<NotificationType, string> = {
  NEW_PROPOSAL: "📝",
  OPINION_REQUEST: "🗳️",
  DEADLINE_SOON: "⏳",
  CONSENSUS_DONE: "✅",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "방금 전";
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

/** TODO(백엔드 연동): 실시간 알림은 이후 WebSocket/SSE 구독으로 대체 예정. 지금은 목데이터 폴링 대신 정적 표시. */
export default function NotificationPanel({ notifications, onMarkAllRead, onSelect }: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full bg-surface border border-surface-3 flex items-center justify-center hover:bg-surface-2 transition"
        aria-label="알림"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-alert text-[10px] leading-4 text-center text-void font-semibold">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-surface-2 border border-surface-3 shadow-panel z-30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-3">
            <span className="text-sm font-medium text-ink">알림</span>
            <button onClick={onMarkAllRead} className="text-xs text-ink-dim hover:text-ink">
              모두 읽음 처리
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="text-xs text-ink-faint px-4 py-6 text-center">알림이 없어요.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  onSelect(n);
                  setOpen(false);
                }}
                className="w-full text-left flex items-start gap-2.5 px-4 py-3 hover:bg-surface-3/60 transition border-b border-surface-3/60 last:border-0"
              >
                <span className="text-sm mt-0.5">{TYPE_ICON[n.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug ${n.is_read ? "text-ink-dim" : "text-ink"}`}>{n.message}</p>
                  <p className="text-[10px] text-ink-faint mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-night mt-1.5 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-dim">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
