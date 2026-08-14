import type { Proposal as DashboardProposal } from "../types";
import type { ProposalFormData } from "../types/proposal";

// 5단계: 최종 제안 등록 (mock)
// 백엔드 "제안 생성" API(POST /api/proposals)가 완성되면
// 이 함수 대신 axios.post('/api/proposals', formData) 호출로 교체하면 됨.
// 지금은 폼 데이터를 받아서 0.6초 후 성공 응답(가짜 id 포함)을 돌려줌.

export interface SubmitProposalResponse {
  id: string;
  submittedAt: string;
}

const SUBMITTED_PROPOSALS_KEY = "meridian.mock-submitted-proposals";

export interface SubmittedProposal extends DashboardProposal {
  content?: string;
  targetGroup?: string;
  author_id?: string;
  final_comment?: string;
  result_summary?: string;
}

export function loadSubmittedProposals(): SubmittedProposal[] {
  try {
    return JSON.parse(window.localStorage.getItem(SUBMITTED_PROPOSALS_KEY) ?? "[]") as SubmittedProposal[];
  } catch {
    return [];
  }
}

export function submitMockProposal(
  data: ProposalFormData,
  authorId: string,
): Promise<SubmitProposalResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = `mock-${Date.now()}`;
      const submittedAt = new Date().toISOString();
      const proposal: SubmittedProposal = {
        id,
        title: data.title,
        content: data.content,
        targetGroup: data.targetGroup,
        author_id: authorId,
        target_team_id: "t-1",
        status: "OPEN",
        deadline: data.deadline,
        created_at: submittedAt,
      };

      window.localStorage.setItem(
        SUBMITTED_PROPOSALS_KEY,
        JSON.stringify([proposal, ...loadSubmittedProposals()]),
      );
      resolve({ id, submittedAt });
    }, 600);
  });
}

function saveSubmittedProposals(proposals: SubmittedProposal[]) {
  window.localStorage.setItem(SUBMITTED_PROPOSALS_KEY, JSON.stringify(proposals));
}

export function updateSubmittedProposal(id: string, data: ProposalFormData) {
  const proposals = loadSubmittedProposals();
  const updated = proposals.map((proposal) => proposal.id === id ? {
    ...proposal,
    title: data.title,
    content: data.content,
    targetGroup: data.targetGroup,
    deadline: data.deadline,
  } : proposal);
  saveSubmittedProposals(updated);
  return updated.find((proposal) => proposal.id === id);
}

export function deleteSubmittedProposal(id: string) {
  saveSubmittedProposals(loadSubmittedProposals().filter((proposal) => proposal.id !== id));
  window.localStorage.removeItem(`meridian:${id}:opinions`);
}

export function completeSubmittedProposal(id: string, finalComment: string, resultSummary: string) {
  const completedAt = new Date().toISOString();
  const proposals = loadSubmittedProposals().map((proposal) => proposal.id === id
    ? {
        ...proposal,
        status: "CONSENSUS_DONE" as const,
        completed_at: completedAt,
        final_comment: finalComment,
        result_summary: resultSummary,
      }
    : proposal);
  saveSubmittedProposals(proposals);
  return proposals.find((proposal) => proposal.id === id);
}

export function isMySubmittedProposal(id: string, userId: string) {
  const proposal = loadSubmittedProposals().find((item) => item.id === id);
  // 이전 버전에서 만든 로컬 제안은 author_id가 없으므로 현재 사용자의 글로 간주한다.
  return Boolean(proposal && (!proposal.author_id || proposal.author_id === userId));
}
