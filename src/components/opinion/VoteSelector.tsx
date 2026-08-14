import type { OpinionType } from '../../types/opinion'
import styles from './VoteSelector.module.css'

interface VoteSelectorProps {
  value: OpinionType | null
  onChange: (value: OpinionType) => void
  disabled?: boolean
}

const voteOptions: Array<{ value: OpinionType; label: string }> = [
  { value: 'AGREE', label: '찬성' },
  { value: 'CONDITIONAL_AGREE', label: '조건부 찬성' },
  { value: 'DISAGREE', label: '반대' },
]

function VoteSelector({ value, onChange, disabled = false }: VoteSelectorProps) {
  return (
    <div className={styles.selector} role="group" aria-label="의견 종류 선택">
      {voteOptions.map((option) => {
        const isSelected = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            className={`${styles.option} ${isSelected ? styles.selected : ''}`}
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default VoteSelector
