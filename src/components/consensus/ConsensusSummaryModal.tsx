import { useEffect, useRef } from 'react'
import type { ConsensusSummary } from '../../types/consensus'
import ConsensusCard from './ConsensusCard'
import styles from './ConsensusSummaryModal.module.css'

interface ConsensusSummaryModalProps {
  isOpen: boolean
  isLoading: boolean
  consensus: ConsensusSummary | null
  error: string | null
  onClose: () => void
  onRetry: () => void
}

function ConsensusSummaryModal({
  isOpen,
  isLoading,
  consensus,
  error,
  onClose,
  onRetry,
}: ConsensusSummaryModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousActiveElement = document.activeElement
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }

      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )

        if (!focusableElements?.length) {
          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)

      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayClick}>
      <section
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consensus-summary-modal-title"
        aria-busy={isLoading}
      >
        <header className={styles.header}>
          <h2 id="consensus-summary-modal-title">의견 요약</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            aria-label="의견 요약 닫기"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading} role="status">
              <span className={styles.spinner} aria-hidden="true" />
              <p>팀원 의견을 정리하고 있습니다.</p>
            </div>
          ) : error ? (
            <div className={styles.error} role="alert">
              <p>{error}</p>
              <button type="button" onClick={onRetry}>
                다시 시도
              </button>
            </div>
          ) : consensus ? (
            <ConsensusCard consensus={consensus} />
          ) : (
            <p className={styles.empty}>요약 결과가 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default ConsensusSummaryModal
