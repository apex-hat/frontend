import styles from "./CultureAnalysisResult.module.css";
import type { CultureAnalysisResult as CultureAnalysisResultType } from "../../types/proposal";

interface Props {
  result: CultureAnalysisResultType;
}

const RISK_LABEL: Record<CultureAnalysisResultType["riskLevel"], string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
};

const RISK_CLASS: Record<CultureAnalysisResultType["riskLevel"], string> = {
  LOW: styles.riskLow,
  MEDIUM: styles.riskMedium,
  HIGH: styles.riskHigh,
};

// 2단계: AI 문화 맥락 분석 결과를 보여주는 컴포넌트.
// props로 결과 데이터만 받아서 그리기만 함 (API 호출 로직은 이 컴포넌트 밖에서 처리)
export default function CultureAnalysisResult({ result }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>AI 문화 맥락 분석 결과</h2>
        <span className={`${styles.riskBadge} ${RISK_CLASS[result.riskLevel]}`}>
          위험도: {RISK_LABEL[result.riskLevel]}
        </span>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>문화권별 해석</p>
        {result.cultureInterpretations.map((item, idx) => (
          <div key={idx} className={styles.interpretationItem}>
            <span className={styles.cultureLabel}>{item.culture}:</span>
            {item.interpretation}
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>오해 가능성이 있는 표현</p>
        {result.riskyExpressions.map((item, idx) => (
          <div key={idx}>
            <span className={styles.riskyExpression}>{item.text}</span>
            <p className={styles.riskyReason}>{item.reason}</p>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>AI 수정 제안</p>
        <div className={styles.suggestedRevisionBox}>
          {result.suggestedRevision}
        </div>
      </div>
    </div>
  );
}
