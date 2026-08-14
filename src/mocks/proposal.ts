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
