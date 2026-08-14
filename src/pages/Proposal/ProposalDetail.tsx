import { useEffect, useState } from "react";
import styles from "./ProposalDetail.module.css";
import { getMockProposalById } from "../../mocks/proposalList";
import type { Proposal } from "../../types/proposal";

const RISK_LABEL: Record<Proposal["riskLevel"], string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
};

const RISK_CLASS: Record<Proposal["riskLevel"], string> = {
  LOW: styles.riskLow,
  MEDIUM: styles.riskMedium,
  HIGH: styles.riskHigh,
};

interface Props {
  proposalId: string;
  onBack: () => void;
  onOpenOpinions: (proposal: Proposal) => void;
}

// 7단계: 제안 상세 화면
// proposalId를 props로 받는 구조라, 나중에 react-router가 붙으면
// useParams()로 얻은 id를 그대로 넘기기만 하면 됨.
export default function ProposalDetail({
  proposalId,
  onBack,
  onOpenOpinions,
}: Props) {
  const [proposal, setProposal] = useState<Proposal | null | undefined>(null);

  useEffect(() => {
    let cancelled = false;

    // TODO(나중에): getMockProposalById 대신 실제 백엔드 API 호출로 교체
    // 예: const { data } = useQuery({ queryKey: ['proposal', proposalId], queryFn: () => axios.get(`/api/proposals/${proposalId}`) })
    getMockProposalById(proposalId).then((data) => {
      if (!cancelled) setProposal(data ?? undefined);
    });

    return () => {
      cancelled = true;
    };
  }, [proposalId]);

  return (
    <div className={styles.container}>
      <button type="button" className={styles.backButton} onClick={onBack}>
        ← 목록으로
      </button>

      {proposal === null && (
        <p className={styles.loadingText}>불러오는 중...</p>
      )}

      {proposal === undefined && (
        <p className={styles.notFoundText}>해당 제안을 찾을 수 없습니다.</p>
      )}

      {proposal && (
        <>
          <div className={styles.header}>
            <h1 className={styles.title}>{proposal.title}</h1>
            <span
              className={`${styles.riskBadge} ${RISK_CLASS[proposal.riskLevel]}`}
            >
              위험도: {RISK_LABEL[proposal.riskLevel]}
            </span>
          </div>

          <div className={styles.metaRow}>
            <span>대상 팀: {proposal.targetTeam}</span>
            <span>대상 문화권: {proposal.targetCulture}</span>
            <span>마감 기한: {proposal.deadline}</span>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionLabel}>내용</p>
            <div className={styles.contentBox}>{proposal.content}</div>
          </div>

          <button
            type="button"
            className={styles.opinionButton}
            onClick={() => onOpenOpinions(proposal)}
          >
            팀 의견 보기
          </button>
        </>
      )}
    </div>
  );
}
