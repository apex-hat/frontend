import type { Opinion, Stance, SupportedLanguage } from "../../../types";
import type { TimezoneEntry } from "../../../lib/api";

interface TeamMemberRowProps {
  member: TimezoneEntry;
  /** 해당 제안에 대한 이 팀원의 Opinion. 레코드가 없으면 미응답. */
  opinion: Opinion | undefined;
  viewerTimezone: string;
  viewerLanguage: SupportedLanguage;
  onWriteOpinion?: () => void;
}

const STATUS_ICON: Record<Stance, { symbol: string; className: string }> = {
  AGREE: { symbol: "✓", className: "text-consensus bg-consensus/15" },
  DISAGREE: { symbol: "✕", className: "text-alert bg-alert/15" },
  CONDITIONAL_AGREE: { symbol: "△", className: "text-day bg-day/15" },
};
const NO_RESPONSE_ICON = { symbol: "…", className: "text-ink-faint bg-surface-3" };

const LANGUAGE_LOCALE: Record<SupportedLanguage, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  de: "de-DE",
  pt: "pt-BR",
};

const FALLBACK_TRANSLATIONS: Partial<Record<SupportedLanguage, Record<string, string>>> = {
  ko: {
    "Sounds good to me.": "좋은 방향이라고 생각합니다.",
  },
};

function formatSubmittedAt(createdAt: string, timezone: string, language: SupportedLanguage) {
  const date = new Date(createdAt);

  if (language === "ko") {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";

    return `${getPart("month")}월 ${getPart("day")}일 ${getPart("hour")}:${getPart("minute")}`;
  }

  return new Intl.DateTimeFormat(LANGUAGE_LOCALE[language], {
    timeZone: timezone,
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** 응답 현황 대시보드에서 팀원의 응답 여부와 의견을 보여주는 한 줄 */
export default function TeamMemberRow({ member, opinion, viewerTimezone, viewerLanguage, onWriteOpinion }: TeamMemberRowProps) {
  const icon = opinion ? STATUS_ICON[opinion.stance] : NO_RESPONSE_ICON;
  const displayedComment = opinion?.comment
    ? opinion.translations?.[viewerLanguage]
      ?? FALLBACK_TRANSLATIONS[viewerLanguage]?.[opinion.comment]
      ?? opinion.comment
    : undefined;

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
          {opinion && (
            <span className="font-mono text-[10px] text-ink-faint shrink-0">
              {formatSubmittedAt(opinion.created_at, viewerTimezone, viewerLanguage)}
            </span>
          )}
        </div>
        {displayedComment && (
          <p className="text-xs text-ink-dim mt-0.5 leading-snug">{displayedComment}</p>
        )}
      </div>

      {onWriteOpinion && (
        <button
          type="button"
          onClick={onWriteOpinion}
          className="shrink-0 rounded-md px-2 py-1 text-[10px] font-medium text-ink-dim transition hover:bg-surface-2 hover:text-ink"
        >
          {opinion ? "의견 수정" : "의견 작성"}
        </button>
      )}

      <span
        className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold ${icon.className}`}
      >
        {icon.symbol}
      </span>
    </div>
  );
}
