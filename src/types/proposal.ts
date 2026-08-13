// 제안 관련 타입 정의
// 나중에 백엔드 API 스펙 나오면 이 타입들을 그거에 맞춰 수정하면 됩니다.

export interface ProposalFormData {
  title: string; // 제목
  content: string; // 내용
  targetTeam: string; // 대상 팀
  targetCulture: string; // 대상 문화권 (예: 한국, 미국, 인도, 브라질 등)
  deadline: string; // 마감 기한 (yyyy-mm-dd)
}

// AI 문화 맥락 분석 결과 (2단계에서 사용할 타입, 미리 정의만 해둠)
export interface CultureAnalysisResult {
  cultureInterpretations: {
    culture: string; // 문화권 이름
    interpretation: string; // 해당 문화권에서의 해석
  }[];
  riskyExpressions: {
    text: string; // 오해 가능성 있는 원문 표현
    reason: string; // 왜 오해될 수 있는지
  }[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH"; // 문화적 위험도
  suggestedRevision: string; // AI가 제안하는 수정 문장
}

// 자주 쓰일 문화권 옵션 (셀렉트박스용, 필요에 따라 수정)
export const CULTURE_OPTIONS = [
  "한국",
  "미국",
  "인도",
  "브라질",
  "일본",
  "독일",
] as const;

// 6~7단계: 제안 목록/상세 화면에서 쓰는 타입.
// 등록된 제안 하나 = 작성 폼 데이터 + 서버가 매겨준 id/생성일/위험도.
// 실제 백엔드 API(GET /api/proposals, GET /api/proposals/{id})가 완성되면
// 응답 형태에 맞춰 이 타입만 수정하면 됨.
export interface Proposal extends ProposalFormData {
  id: string;
  createdAt: string; // ISO 문자열
  riskLevel: CultureAnalysisResult["riskLevel"];
}
