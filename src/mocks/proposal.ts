import type { Proposal as DashboardProposal } from "../types";

// 제안 "완료 처리"(POST /api/proposals/{id}/complete)는 Backend가 아직 501이라
// 이 파일은 완료 흐름 전용 localStorage Mock만 남긴다. 생성/수정/삭제는 lib/api.ts의
// createProposal/updateProposal/deleteProposal 실호출로 대체됐다.

const SUBMITTED_PROPOSALS_KEY = "meridian.mock-submitted-proposals";

export interface SubmittedProposal extends DashboardProposal {
  targetGroup?: string;
  final_comment?: string;
  result_summary?: string;
}

export function loadSubmittedProposals(): SubmittedProposal[] {
  try {
    const stored = JSON.parse(window.localStorage.getItem(SUBMITTED_PROPOSALS_KEY) ?? "[]") as Array<Omit<SubmittedProposal, "status"> & { status: string }>;
    return stored.map((proposal) => ({
      ...proposal,
      status: ["CONSENSUS_DONE", "CLOSED"].includes(proposal.status)
        ? "COMPLETED"
        : proposal.status === "REVIEWING"
          ? "IN_PROGRESS"
          : proposal.status as SubmittedProposal["status"],
    }));
  } catch {
    return [];
  }
}

function saveSubmittedProposals(proposals: SubmittedProposal[]) {
  window.localStorage.setItem(SUBMITTED_PROPOSALS_KEY, JSON.stringify(proposals));
}

export function completeSubmittedProposal(id: string, finalComment: string, resultSummary: string) {
  const completedAt = new Date().toISOString();
  const proposals = loadSubmittedProposals().map((proposal) => proposal.id === id
    ? {
        ...proposal,
        status: "COMPLETED" as const,
        completed_at: completedAt,
        final_comment: finalComment,
        result_summary: resultSummary,
      }
    : proposal);
  saveSubmittedProposals(proposals);
  return proposals.find((proposal) => proposal.id === id);
}
