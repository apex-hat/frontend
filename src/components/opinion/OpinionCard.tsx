import type { Opinion, OpinionType } from '../../types/opinion'
import styles from './OpinionCard.module.css'

interface OpinionCardProps {
  opinion: Opinion
}

const opinionLabels: Record<OpinionType, string> = {
  AGREE: '찬성',
  DISAGREE: '반대',
  CONDITIONAL: '조건부 찬성',
}

const opinionBadgeClasses: Record<OpinionType, string> = {
  AGREE: styles.agree,
  DISAGREE: styles.disagree,
  CONDITIONAL: styles.conditional,
}

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function OpinionCard({ opinion }: OpinionCardProps) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.authorName}>{opinion.author.name}</h3>
          {opinion.author.company && (
            <p className={styles.company}>{opinion.author.company}</p>
          )}
        </div>
        <span className={`${styles.badge} ${opinionBadgeClasses[opinion.type]}`}>
          {opinionLabels[opinion.type]}
        </span>
      </header>

      <p className={styles.comment}>{opinion.comment}</p>
      <time className={styles.createdAt} dateTime={opinion.createdAt}>
        {dateFormatter.format(new Date(opinion.createdAt))}
      </time>
    </article>
  )
}

export default OpinionCard
