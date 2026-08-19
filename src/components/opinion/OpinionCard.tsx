import type { Opinion, OpinionType } from '../../types/opinion'
import styles from './OpinionCard.module.css'

interface OpinionCardProps {
  opinion: Opinion
  canDelete?: boolean
  onDelete?: (opinionId: string) => void
}

const opinionLabels: Record<OpinionType, string> = {
  AGREE: '찬성',
  DISAGREE: '반대',
  CONDITIONAL_AGREE: '조건부 찬성',
}

const opinionCardClasses: Record<OpinionType, string> = {
  AGREE: styles.cardAgree,
  DISAGREE: styles.cardDisagree,
  CONDITIONAL_AGREE: styles.cardConditional,
}

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function OpinionCard({ opinion, canDelete = false, onDelete }: OpinionCardProps) {
  return (
    <article className={`${styles.card} ${opinionCardClasses[opinion.type]}`}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.authorName}>{opinion.author.name}</h3>
          {opinion.author.company && (
            <p className={styles.company}>{opinion.author.company}</p>
          )}
        </div>
        <span className={styles.visuallyHidden}>
          의견: {opinionLabels[opinion.type]}
        </span>
      </header>

      <p className={styles.comment}>{opinion.comment}</p>
      <footer className={styles.footer}>
        <time className={styles.createdAt} dateTime={opinion.updatedAt ?? opinion.createdAt}>
          {dateFormatter.format(new Date(opinion.updatedAt ?? opinion.createdAt))}
          {opinion.updatedAt && ' 수정'}
        </time>
        {canDelete && onDelete && (
          <button
            type="button"
            className={styles.deleteButton}
            onClick={() => onDelete(opinion.id)}
            aria-label="내 의견 삭제"
          >
            삭제
          </button>
        )}
      </footer>
    </article>
  )
}

export default OpinionCard
