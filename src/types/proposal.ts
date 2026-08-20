// 제안 작성 폼의 로컬 UI 상태. 실제 API 데이터 계약(응답/도메인 모델)은 ../types의 Proposal을 쓴다.

export interface ProposalFormData {
  title: string; // 제목
  content: string; // 내용
  deadline: string; // 마감 기한 (ISO 8601)
  targetCultures: string[]; // AI 문화 맥락 분석 대상 문화권(국가 코드)
}
