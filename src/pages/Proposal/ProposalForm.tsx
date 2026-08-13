import { useState } from "react";
import styles from "./ProposalForm.module.css";
import resultStyles from "./CultureAnalysisResult.module.css";
import CultureAnalysisResult from "./CultureAnalysisResult";
import ProposalComparison from "./ProposalComparison";
import { getMockCultureAnalysis } from "../../mocks/cultureAnalysis";
import {
  CULTURE_OPTIONS,
  type ProposalFormData,
  type CultureAnalysisResult as CultureAnalysisResultType,
} from "../../types/proposal";

// 1단계: 제안 작성 폼
// 2단계: "AI 문화 맥락 분석 요청" 버튼 → mock 데이터로 분석 결과 화면 표시
// 3단계: 원문 / AI 수정 제안 비교 UI
// 4단계: AI 수정안 적용 버튼 (적용 후에도 직접 수정 가능)

const initialFormData: ProposalFormData = {
  title: "",
  content: "",
  targetTeam: "",
  targetCulture: CULTURE_OPTIONS[0],
  deadline: "",
};

export default function ProposalForm() {
  const [formData, setFormData] = useState<ProposalFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<CultureAnalysisResultType | null>(null);
  // 분석을 요청했던 시점의 원문 스냅샷 (비교 UI에서 "원문" 쪽에 고정으로 보여주기 위함)
  const [originalContent, setOriginalContent] = useState("");
  const [isApplied, setIsApplied] = useState(false);

  const handleChange = (field: keyof ProposalFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    formData.title.trim() !== "" &&
    formData.content.trim() !== "" &&
    formData.targetTeam.trim() !== "" &&
    formData.deadline !== "";

  const handleAnalyzeClick = async () => {
    if (!isFormValid) {
      setError("제목, 내용, 대상 팀, 마감 기한을 모두 입력해주세요.");
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setIsApplied(false);
    setOriginalContent(formData.content);

    // TODO(나중에): getMockCultureAnalysis 대신 실제 백엔드 API 호출로 교체
    // 예: const result = await axios.post('/api/proposals/analyze', formData)
    const result = await getMockCultureAnalysis(formData);

    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const handleApplyRevision = () => {
    if (!analysisResult) return;
    setFormData((prev) => ({
      ...prev,
      content: analysisResult.suggestedRevision,
    }));
    setIsApplied(true);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>제안 작성</h1>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          제목
        </label>
        <input
          id="title"
          className={styles.input}
          type="text"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="제안 제목을 입력하세요"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="content">
          내용
        </label>
        <textarea
          id="content"
          className={styles.textarea}
          value={formData.content}
          onChange={(e) => handleChange("content", e.target.value)}
          placeholder="제안 내용을 입력하세요"
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="targetTeam">
            대상 팀
          </label>
          <input
            id="targetTeam"
            className={styles.input}
            type="text"
            value={formData.targetTeam}
            onChange={(e) => handleChange("targetTeam", e.target.value)}
            placeholder="예: 디자인팀"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="targetCulture">
            대상 문화권
          </label>
          <select
            id="targetCulture"
            className={styles.select}
            value={formData.targetCulture}
            onChange={(e) => handleChange("targetCulture", e.target.value)}
          >
            {CULTURE_OPTIONS.map((culture) => (
              <option key={culture} value={culture}>
                {culture}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="deadline">
          마감 기한
        </label>
        <input
          id="deadline"
          className={styles.input}
          type="date"
          value={formData.deadline}
          onChange={(e) => handleChange("deadline", e.target.value)}
        />
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleAnalyzeClick}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? "분석 중..." : "AI 문화 맥락 분석 요청"}
        </button>
      </div>

      {isAnalyzing && (
        <p className={resultStyles.loadingText}>AI가 분석하고 있습니다...</p>
      )}

      {analysisResult && (
        <>
          <CultureAnalysisResult result={analysisResult} />
          <ProposalComparison
            originalContent={originalContent}
            suggestedRevision={analysisResult.suggestedRevision}
            applied={isApplied}
            onApply={handleApplyRevision}
          />
        </>
      )}
    </div>
  );
}
