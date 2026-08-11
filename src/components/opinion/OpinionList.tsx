import type { Opinion } from '../../types/opinion'
import OpinionCard from './OpinionCard'
import styles from './OpinionList.module.css'

interface OpinionListProps {
  opinions: Opinion[]
}

function OpinionList({ opinions }: OpinionListProps) {
  if (opinions.length === 0) {
    return <p className={styles.empty}>아직 등록된 의견이 없습니다.</p>
  }

  return (
    <ul className={styles.list} aria-label="팀원 의견 목록">
      {opinions.map((opinion) => (
        <li key={opinion.id}>
          <OpinionCard opinion={opinion} />
        </li>
      ))}
    </ul>
  )
}

export default OpinionList
