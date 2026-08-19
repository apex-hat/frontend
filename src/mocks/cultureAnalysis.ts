import type {
  CultureAnalysisResult,
  ProposalFormData,
} from "../types/proposal";

// 2단계: 실제 백엔드 API가 아직 없으니, 가짜(mock) 분석 결과를 반환하는 함수.
// 나중에 백엔드 API 붙일 때 이 함수 대신 axios/TanStack Query 호출로 교체하면 됨.
// (함수 시그니처는 최대한 실제 API처럼 맞춰둠: 폼 데이터를 받아서 Promise로 결과를 돌려줌)

export function getMockCultureAnalysis(
  data: ProposalFormData,
): Promise<CultureAnalysisResult> {
  return new Promise((resolve) => {
    // 실제 네트워크 요청처럼 느껴지도록 약간의 딜레이를 줌
    setTimeout(() => {
      resolve({
        cultureInterpretations: [
          {
            culture: "한국",
            interpretation:
              "완곡한 반대 또는 우려의 표현으로 읽힐 수 있습니다.",
          },
          {
            culture: `${data.targetGroup} · 저맥락 문화권 구성원`,
            interpretation: "의견의 결론과 요청 사항이 모호하게 느껴질 수 있습니다.",
          },
          {
            culture: `${data.targetGroup} · 고맥락 문화권 구성원`,
            interpretation: "완곡한 우려 또는 추가 논의 요청으로 받아들일 수 있습니다.",
          },
        ],
        riskyExpressions: [
          {
            text: "괜찮은 것 같아요",
            reason:
              "문화권에 따라 긍정/완곡한 부정으로 해석이 갈릴 수 있는 표현입니다.",
          },
        ],
        riskLevel: "MEDIUM",
        suggestedRevision: `${data.content.slice(0, 20)}... (AI가 더 명확하게 다듬은 문장이 여기에 표시됩니다)`,
      });
    }, 800);
  });
}
