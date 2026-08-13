import type { Opinion } from '../../types/opinion'
import OpinionCard from './OpinionCard'
import styles from './OpinionList.module.css'

interface OpinionListProps {
  opinions: Opinion[]
  currentUserId: string
  onDelete: (opinionId: string) => void
}

function OpinionList({ opinions, currentUserId, onDelete }: OpinionListProps) {
  if (opinions.length === 0) {
    return <p className={styles.empty}>아직 등록된 의견이 없습니다.</p>
  }

  return (
    <ul className={styles.list} aria-label="팀원 의견 목록">
      {opinions.map((opinion) => (
        <li key={opinion.id}>
          <OpinionCard
            opinion={opinion}
            canDelete={opinion.author.id === currentUserId}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  )
}

export default OpinionList
