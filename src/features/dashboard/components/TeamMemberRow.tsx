import type { Opinion, Stance } from "../../../types";
import type { TimezoneEntry } from "../../../lib/api";

interface TeamMemberRowProps {
  member: TimezoneEntry;
  /** 해당 제안에 대한 이 팀원의 Opinion. 레코드가 없으면 미응답. */
  opinion: Opinion | undefined;
  viewerTimezone: string;
}

const STATUS_ICON: Record<Stance, { symbol: string; className: string }> = {
  AGREE: { symbol: "✓", className: "text-consensus bg-consensus/15" },
  DISAGREE: { symbol: "✕", className: "text-alert bg-alert/15" },
  CONDITIONAL: { symbol: "△", className: "text-day bg-day/15" },
};
const NO_RESPONSE_ICON = { symbol: "…", className: "text-ink-faint bg-surface-3" };

function formatSubmittedAt(createdAt: string, timezone: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: timezone,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(createdAt));
}

/** 응답 현황 대시보드에서 팀원의 응답 여부와 의견을 보여주는 한 줄 */
export default function TeamMemberRow({ member, opinion, viewerTimezone }: TeamMemberRowProps) {
  const icon = opinion ? STATUS_ICON[opinion.stance] : NO_RESPONSE_ICON;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[9px] font-semibold text-void"
        style={{ backgroundColor: member.avatarColor }}
      >
        {member.name.slice(0, 1)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink truncate">{member.name}</span>
          <span className="font-mono text-[10px] text-ink-faint shrink-0">
            {opinion ? `내 시간 ${formatSubmittedAt(opinion.created_at, viewerTimezone)}` : "미응답"}
          </span>
        </div>
        {opinion?.comment && (
          <p className="text-xs text-ink-dim mt-0.5 leading-snug">{opinion.comment}</p>
        )}
      </div>

      <span
        className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold ${icon.className}`}
      >
        {icon.symbol}
      </span>
    </div>
  );
}
