import styles from "./ProposalComparison.module.css";

interface Props {
  originalContent: string;
  suggestedRevision: string;
  applied: boolean;
  onApply: () => void;
}

// 3단계: 원문 / AI 수정 제안 비교 UI
// 4단계: "수정안 적용" 버튼 — 누르면 부모(ProposalForm)의 content가 suggestedRevision으로 교체됨
// "직접 수정"은 별도 버튼이 필요 없음 — 적용 후에도 폼의 내용 textarea는 계속 편집 가능하기 때문
export default function ProposalComparison({
  originalContent,
  suggestedRevision,
  applied,
  onApply,
}: Props) {
  return (
    <div className={styles.container}>
      <p className={styles.title}>원문 / AI 수정 제안 비교</p>

      <div className={styles.compareRow}>
        <div className={styles.compareCol}>
          <p className={styles.colLabel}>원문</p>
          <div className={`${styles.textBox} ${styles.originalBox}`}>
            {originalContent}
          </div>
        </div>

        <div className={styles.compareCol}>
          <p className={styles.colLabel}>AI 수정 제안</p>
          <div className={`${styles.textBox} ${styles.suggestedBox}`}>
            {suggestedRevision}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        {applied ? (
          <span className={styles.appliedBadge}>✓ 수정안이 적용되었습니다</span>
        ) : (
          <button
            type="button"
            className={styles.applyButton}
            onClick={onApply}
          >
            이 수정안 적용하기
          </button>
        )}
      </div>

      <p className={styles.hint}>
        적용 후에도 위쪽 "내용" 입력창에서 직접 수정할 수 있습니다.
      </p>
    </div>
  );
}
