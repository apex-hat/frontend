// 제안 작성 폼의 로컬 UI 상태. 실제 API 데이터 계약(응답/도메인 모델)은 ../types의 Proposal을 쓴다.

export interface ProposalFormData {
  title: string; // 제목
  content: string; // 내용
  targetGroup: string; // 제안을 공유할 대상 그룹
  deadline: string; // 마감 기한 (ISO 8601)
}
