import type { ProposalStatus } from "../../../types";

const STATUS_CONFIG: Record<ProposalStatus, { label: string; className: string }> = {
  OPEN: { label: "진행 중", className: "bg-day/15 text-day border-day/30" },
  DRAFT: { label: "작성 중", className: "bg-surface-3 text-ink-faint border-surface-3" },
  IN_PROGRESS: { label: "진행 중", className: "bg-day/15 text-day border-day/30" },
  CONSENSUS_READY: { label: "분석 가능", className: "bg-night/15 text-night border-night/30" },
  COMPLETED: { label: "합의 완료", className: "bg-consensus/15 text-consensus border-consensus/30" },
};

export default function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
