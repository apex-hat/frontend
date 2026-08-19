import { useEffect, useState } from "react";
import styles from "./ProposalList.module.css";
import { getMockProposals } from "../../mocks/proposalList";
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
  onSelect: (id: string) => void;
  onCreateNew: () => void;
}

// 6단계: 제안 목록 화면
// 지금은 mock 데이터를 useEffect에서 불러오는 방식.
// 나중에 GET /api/proposals가 준비되면 TanStack Query useQuery로 교체하면 됨.
// (실제 라우팅(react-router 등)이 붙기 전이라, 상세로 이동은 onSelect 콜백으로 임시 처리함)
export default function ProposalList({ onSelect, onCreateNew }: Props) {
  const [proposals, setProposals] = useState<Proposal[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    // TODO(나중에): getMockProposals 대신 실제 백엔드 API 호출로 교체
    // 예: const { data } = useQuery({ queryKey: ['proposals'], queryFn: () => axios.get('/api/proposals') })
    getMockProposals().then((data) => {
      if (!cancelled) setProposals(data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>제안 관리</h1>
        <button
          type="button"
          className={styles.newButton}
          onClick={onCreateNew}
        >
          제안 작성
        </button>
      </div>

      {proposals === null && (
        <p className={styles.loadingText}>불러오는 중...</p>
      )}

      {proposals !== null && proposals.length === 0 && (
        <p className={styles.emptyText}>등록된 제안이 없습니다.</p>
      )}

      {proposals !== null && proposals.length > 0 && (
        <div className={styles.list}>
          {proposals.map((proposal) => (
            <button
              key={proposal.id}
              type="button"
              className={styles.card}
              onClick={() => onSelect(proposal.id)}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardTitle}>{proposal.title}</span>
                <span
                  className={`${styles.riskBadge} ${RISK_CLASS[proposal.riskLevel]}`}
                >
                  {RISK_LABEL[proposal.riskLevel]}
                </span>
              </div>
              <div className={styles.cardMeta}>
                {proposal.targetGroup} · 마감 {proposal.deadline}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
