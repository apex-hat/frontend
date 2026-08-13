import type { ProposalFormData } from "../types/proposal";

// 5단계: 최종 제안 등록 (mock)
// 백엔드 "제안 생성" API(POST /api/proposals)가 완성되면
// 이 함수 대신 axios.post('/api/proposals', formData) 호출로 교체하면 됨.
// 지금은 폼 데이터를 받아서 0.6초 후 성공 응답(가짜 id 포함)을 돌려줌.

export interface SubmitProposalResponse {
  id: string;
  submittedAt: string;
}

export function submitMockProposal(
  data: ProposalFormData,
): Promise<SubmitProposalResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("등록할 제안 데이터:", data);
      resolve({
        id: `mock-${Date.now()}`,
        submittedAt: new Date().toISOString(),
      });
    }, 600);
  });
}
