import type {
  ConsensusSummary,
  OpinionCategorySummary,
} from '../../types/consensus'
import styles from './ConsensusCard.module.css'

interface ConsensusCardProps {
  consensus: ConsensusSummary
}

interface CategorySectionProps {
  title: string
  category: OpinionCategorySummary
  tone: 'agree' | 'disagree' | 'conditional'
}

function CategorySection({ title, category, tone }: CategorySectionProps) {
  return (
    <section className={`${styles.category} ${styles[tone]}`}>
      <h3 className={styles.categoryTitle}>{title}</h3>
      <p className={styles.categorySummary}>{category.summary}</p>
    </section>
  )
}

function ConsensusCard({ consensus }: ConsensusCardProps) {
  const hasCategorySummary = Boolean(
    consensus.agree || consensus.disagree || consensus.conditional,
  )

  return (
    <article className={styles.card}>
      <p className={styles.summary}>{consensus.summary}</p>

      <div className={styles.categories}>
        {consensus.agree && (
          <CategorySection title="찬성" category={consensus.agree} tone="agree" />
        )}
        {consensus.disagree && (
          <CategorySection
            title="반대"
            category={consensus.disagree}
            tone="disagree"
          />
        )}
        {consensus.conditional && (
          <CategorySection
            title="조건부"
            category={consensus.conditional}
            tone="conditional"
          />
        )}
        {!hasCategorySummary && (
          <p className={styles.emptyCategories}>요약할 의견이 없습니다.</p>
        )}
      </div>

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
