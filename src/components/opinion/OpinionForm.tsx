import { useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import type { Opinion, OpinionAuthor, OpinionType } from '../../types/opinion'
import VoteSelector from './VoteSelector'
import styles from './OpinionForm.module.css'

interface OpinionFormProps {
  author: OpinionAuthor
  onSubmit: (opinion: Opinion) => void
}

function OpinionForm({ author, onSubmit }: OpinionFormProps) {
  const [opinionType, setOpinionType] = useState<OpinionType | null>(null)
  const [comment, setComment] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const trimmedComment = comment.trim()
  const canSubmit = opinionType !== null && trimmedComment.length > 0

  useLayoutEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [comment])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!opinionType || !trimmedComment) {
      return
    }

    onSubmit({
      id: crypto.randomUUID(),
      author,
      type: opinionType,
      comment: trimmedComment,
      createdAt: new Date().toISOString(),
    })

    setOpinionType(null)
    setComment('')
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>의견 선택</legend>
        <VoteSelector value={opinionType} onChange={setOpinionType} />
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
          rows={4}
          placeholder="제안에 대한 의견과 이유를 작성해주세요."
          onChange={(event) => setComment(event.target.value)}
        />
      </div>

      <button className={styles.submitButton} type="submit" disabled={!canSubmit}>
        의견 제출
      </button>
    </form>
  )
}

export default OpinionForm
