import { useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import type { Opinion, OpinionDraft, OpinionType } from '../../types/opinion'
import VoteSelector from './VoteSelector'
import styles from './OpinionForm.module.css'

interface OpinionFormProps {
  existingOpinion?: Opinion
  isSubmitting: boolean
  onSubmit: (draft: OpinionDraft) => Promise<void>
}

const MAX_COMMENT_LENGTH = 500

function OpinionForm({
  existingOpinion,
  isSubmitting,
  onSubmit,
}: OpinionFormProps) {
  const [opinionType, setOpinionType] = useState<OpinionType | null>(
    existingOpinion?.type ?? null,
  )
  const [comment, setComment] = useState(existingOpinion?.comment ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const trimmedComment = comment.trim()
  const canSubmit =
    opinionType !== null && trimmedComment.length > 0 && !isSubmitting

  useLayoutEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [comment])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!opinionType || !trimmedComment) {
      return
    }

    await onSubmit({
      type: opinionType,
      comment: trimmedComment,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>의견 선택</legend>
        <VoteSelector
          value={opinionType}
          onChange={setOpinionType}
          disabled={isSubmitting}
        />
      </fieldset>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="opinion-comment">
          코멘트
        </label>
        <textarea
          ref={textareaRef}
          id="opinion-comment"
          className={styles.textarea}
          value={comment}
          maxLength={MAX_COMMENT_LENGTH}
          rows={4}
          placeholder="제안에 대한 의견과 이유를 작성해주세요."
          onChange={(event) => setComment(event.target.value)}
          disabled={isSubmitting}
        />
        <span className={styles.characterCount}>
          {comment.length}/{MAX_COMMENT_LENGTH}
        </span>
      </div>

      <button className={styles.submitButton} type="submit" disabled={!canSubmit}>
        {isSubmitting
          ? '저장 중...'
          : existingOpinion
            ? '내 의견 수정'
            : '의견 제출'}
      </button>
    </form>
  )
}

export default OpinionForm
