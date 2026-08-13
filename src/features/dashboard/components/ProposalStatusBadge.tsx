import type { ProposalStatus } from "../../../types";

// Proposal.status가 OPEN이 아니면(DRAFT/REVIEWING/CONSENSUS_DONE/CLOSED) "종료됨"으로 묶어 표시.
const STATUS_CONFIG: Record<ProposalStatus, { label: string; className: string }> = {
  OPEN: { label: "진행 중", className: "bg-day/15 text-day border-day/30" },
  DRAFT: { label: "종료됨", className: "bg-surface-3 text-ink-faint border-surface-3" },
  REVIEWING: { label: "종료됨", className: "bg-surface-3 text-ink-faint border-surface-3" },
  CONSENSUS_DONE: { label: "종료됨 · 합의 완료", className: "bg-consensus/15 text-consensus border-consensus/30" },
  CLOSED: { label: "종료됨", className: "bg-surface-3 text-ink-faint border-surface-3" },
};

export default function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
