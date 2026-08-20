import { useEffect, useRef, useState } from "react";
import type { Notification } from "../../../types";

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkRead: (notification: Notification) => void;
  onSelect: (notification: Notification) => void;
}

function timeAgo(iso: string) {
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "방금 전";
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

/** TODO(백엔드 연동): 실시간 알림은 이후 WebSocket/SSE 구독으로 대체 예정. 지금은 목데이터 폴링 대신 정적 표시. */
export default function NotificationPanel({ notifications, onMarkAllRead, onMarkRead, onSelect }: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ notification: Notification; x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-7 w-7 items-center justify-center rounded-md text-ink-dim transition hover:bg-surface-2 hover:text-ink"
        aria-label="알림"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 h-3.5 min-w-[14px] rounded-full bg-alert px-1 text-center text-[9px] font-semibold leading-[14px] text-void">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-surface-3 bg-surface shadow-panel">
          <div className="flex items-center justify-between border-b border-surface-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink">알림</span>
              {unreadCount > 0 && <span className="text-[10px] text-ink-faint">{unreadCount}개 새 알림</span>}
            </div>
            <button onClick={onMarkAllRead} className="text-[11px] text-ink-faint underline-offset-4 hover:text-ink hover:underline">
              모두 읽음
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="text-xs text-ink-faint px-4 py-6 text-center">알림이 없어요.</p>
            )}
            {sortedNotifications.map((n) => (
              <button
                key={n.id}
                onContextMenu={(event) => {
                  event.preventDefault();
                  if (!n.is_read) setContextMenu({ notification: n, x: event.clientX, y: event.clientY });
                }}
                onClick={() => {
                  onSelect(n);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-3 border-b border-surface-3/60 px-4 py-3 text-left transition last:border-0 hover:bg-surface-2"
              >
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.is_read ? "bg-surface-3" : "bg-night"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug ${n.is_read ? "text-ink-dim" : "text-ink"}`}>{n.message}</p>
                  <p className="text-[10px] text-ink-faint mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
          {contextMenu && (
            <div
              className="fixed z-50 w-32 overflow-hidden rounded-lg border border-surface-3 bg-surface-2 py-1 shadow-panel"
              style={{ left: Math.min(contextMenu.x, window.innerWidth - 145), top: Math.min(contextMenu.y, window.innerHeight - 60) }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  onMarkRead(contextMenu.notification);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-xs text-ink-dim underline-offset-4 hover:text-ink hover:underline"
              >
                읽음 처리
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="text-ink-dim">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
