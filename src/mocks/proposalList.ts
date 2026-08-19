import type { Proposal } from "../types/proposal";

// 6~7단계: 제안 목록/상세 화면용 mock 데이터.
// 나중에 백엔드가 GET /api/proposals, GET /api/proposals/{id}를 완성하면
// getMockProposals / getMockProposalById 대신 axios(TanStack Query) 호출로 교체.

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: "1",
    title: "신규 온보딩 문서 제안",
    content: "괜찮은 것 같아요. 그런데 몇 가지 확인이 필요합니다.",
    targetGroup: "제품 디자인 그룹",
    targetCultures: [],
    deadline: "2026-08-20",
    createdAt: "2026-08-10T09:00:00.000Z",
    riskLevel: "MEDIUM",
  },
  {
    id: "2",
    title: "분기별 회고 프로세스 변경 제안",
    content: "이번 분기부터는 비동기로 회고를 진행하려고 합니다.",
    targetGroup: "글로벌 개발 그룹",
    targetCultures: [],
    deadline: "2026-08-25",
    createdAt: "2026-08-11T02:30:00.000Z",
    riskLevel: "LOW",
  },
  {
    id: "3",
    title: "마케팅 카피 문구 검토 요청",
    content: "다소 공격적인 표현이 포함되어 있어 검토가 필요할 것 같습니다.",
    targetGroup: "글로벌 마케팅 그룹",
    targetCultures: [],
    deadline: "2026-08-18",
    createdAt: "2026-08-12T11:15:00.000Z",
    riskLevel: "HIGH",
  },
];

export function getMockProposals(): Promise<Proposal[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_PROPOSALS), 400);
  });
}

export function getMockProposalById(id: string): Promise<Proposal | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_PROPOSALS.find((p) => p.id === id));
    }, 400);
  });
}
