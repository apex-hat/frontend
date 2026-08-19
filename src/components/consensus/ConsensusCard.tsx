import type { ConsensusStatus, ConsensusSummary } from '../../types/consensus'
import styles from './ConsensusCard.module.css'

const STATUS_LABEL: Record<ConsensusStatus, string> = {
  AGREED: '합의',
  PARTIAL: '부분 합의',
  DISAGREED: '이견 있음',
  PENDING: '보류',
}

const STATUS_TONE: Record<ConsensusStatus, 'agree' | 'disagree' | 'conditional'> = {
  AGREED: 'agree',
  PARTIAL: 'conditional',
  DISAGREED: 'disagree',
  PENDING: 'conditional',
}

interface ListSectionProps {
  title: string
  items: string[]
  tone: 'agree' | 'disagree' | 'conditional'
}

function ListSection({ title, items, tone }: ListSectionProps) {
  if (items.length === 0) return null
  return (
    <section className={`${styles.category} ${styles[tone]}`}>
      <h3 className={styles.categoryTitle}>{title}</h3>
      <ul className={styles.categoryList}>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

interface ConsensusCardProps {
  consensus: ConsensusSummary
}

function ConsensusCard({ consensus }: ConsensusCardProps) {
  const hasDetails =
    consensus.keyIssues.length > 0 || consensus.culturalAnalysis.length > 0 || consensus.hiddenOpposition.length > 0

  return (
    <article className={styles.card}>
      <span className={`${styles.statusBadge} ${styles[STATUS_TONE[consensus.consensusStatus]]}`}>
        {STATUS_LABEL[consensus.consensusStatus]}
      </span>
      <p className={styles.summary}>{consensus.summary}</p>

      <div className={styles.categories}>
        <ListSection title="핵심 쟁점" items={consensus.keyIssues} tone="conditional" />
        <ListSection title="문화적 표현 분석" items={consensus.culturalAnalysis} tone="agree" />
        <ListSection title="숨겨진 반대 의견" items={consensus.hiddenOpposition} tone="disagree" />
        {!hasDetails && <p className={styles.emptyCategories}>요약할 의견이 없습니다.</p>}
      </div>

      {consensus.recommendedActions && (
        <section className={styles.recommendation}>
          <h3 className={styles.categoryTitle}>권장 후속 조치</h3>
          <p className={styles.categorySummary}>{consensus.recommendedActions}</p>
        </section>
      )}

      <time className={styles.generatedAt} dateTime={consensus.generatedAt}>
        {new Intl.DateTimeFormat('ko-KR', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(consensus.generatedAt))}{' '}
        생성
      </time>
    </article>
  )
}

export default ConsensusCard
