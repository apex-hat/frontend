import { useMemo, useState } from 'react'
import ConsensusSummaryModal from '../../components/consensus/ConsensusSummaryModal'
import OpinionForm from '../../components/opinion/OpinionForm'
import OpinionList from '../../components/opinion/OpinionList'
import { requestMockConsensus } from '../../mocks/consensus'
import { loadOpinions, saveOpinions } from '../../services/opinionStorage'
import type { ConsensusSummary } from '../../types/consensus'
import type {
  Opinion,
  OpinionAuthor,
  OpinionDraft,
  OpinionType,
} from '../../types/opinion'
import styles from './ConsensusDevPage.module.css'

const currentUser: OpinionAuthor = {
  id: 'current-user',
  name: '현재 사용자',
  company: 'Meridian',
  country: '대한민국',
  culturalRegion: '동아시아',
}

function ConsensusDevPage() {
  const [opinions, setOpinions] = useState<Opinion[]>(loadOpinions)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formStatus, setFormStatus] = useState<string | null>(null)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [consensus, setConsensus] = useState<ConsensusSummary | null>(null)

  const currentUserOpinion = opinions.find(
    (opinion) => opinion.author.id === currentUser.id,
  )
  const opinionCounts = useMemo(
    () =>
      opinions.reduce<Record<OpinionType, number>>(
        (counts, opinion) => ({
          ...counts,
          [opinion.type]: counts[opinion.type] + 1,
        }),
        { AGREE: 0, CONDITIONAL: 0, DISAGREE: 0 },
      ),
    [opinions],
  )

  const handleOpinionSubmit = async (draft: OpinionDraft) => {
    setIsSubmitting(true)
    setFormStatus(null)

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 350))
      const now = new Date().toISOString()
      const nextOpinion: Opinion = currentUserOpinion
        ? { ...currentUserOpinion, ...draft, updatedAt: now }
        : {
            id: crypto.randomUUID(),
            author: currentUser,
            ...draft,
            createdAt: now,
          }
      const nextOpinions = currentUserOpinion
        ? opinions.map((opinion) =>
            opinion.id === currentUserOpinion.id ? nextOpinion : opinion,
          )
        : [nextOpinion, ...opinions]

      saveOpinions(nextOpinions)
      setOpinions(nextOpinions)
      setConsensus(null)
      setFormStatus(
        currentUserOpinion ? '내 의견을 수정했습니다.' : '의견을 등록했습니다.',
      )
    } catch {
      setFormStatus('의견을 저장하지 못했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpinionDelete = (opinionId: string) => {
    const targetOpinion = opinions.find((opinion) => opinion.id === opinionId)

    if (targetOpinion?.author.id !== currentUser.id) {
      return
    }

    if (!window.confirm('내 의견을 삭제할까요?')) {
      return
    }

    try {
      const nextOpinions = opinions.filter((opinion) => opinion.id !== opinionId)
      saveOpinions(nextOpinions)
      setOpinions(nextOpinions)
      setConsensus(null)
      setFormStatus('내 의견을 삭제했습니다.')
    } catch {
      setFormStatus('의견을 삭제하지 못했습니다. 다시 시도해주세요.')
    }
  }

  const loadSummary = async () => {
    setIsSummaryLoading(true)
    setSummaryError(null)

    try {
      setConsensus(await requestMockConsensus(opinions))
    } catch {
      setSummaryError('의견 요약을 불러오지 못했습니다.')
    } finally {
      setIsSummaryLoading(false)
    }
  }

  const handleSummaryOpen = () => {
    if (opinions.length === 0 || isSummaryLoading) {
      return
    }

    setIsSummaryOpen(true)
    void loadSummary()
  }

  const handleSummaryClose = () => {
    setIsSummaryOpen(false)
    setIsSummaryLoading(false)
    setSummaryError(null)
  }

  return (
    <main className={styles.page} data-consensus-dev-page>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>제안 #proposal-1</p>
        <h1 className={styles.title}>팀 의견 수렴</h1>
        <p className={styles.description}>
          MVP 범위와 일정에 대한 의견을 선택하고 근거를 남겨주세요.
        </p>
      </header>

      <section className={styles.section} aria-label="의견 작성 폼">
        <OpinionForm
          key={
            currentUserOpinion?.updatedAt ??
            currentUserOpinion?.id ??
            'new-opinion'
          }
          existingOpinion={currentUserOpinion}
          isSubmitting={isSubmitting}
          onSubmit={handleOpinionSubmit}
        />
        {formStatus && (
          <p className={styles.status} role="status">
            {formStatus}
          </p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="opinion-list-title">
        <div className={styles.listHeader}>
          <h2 id="opinion-list-title" className={styles.sectionTitle}>
            팀원 의견 <span>{opinions.length}</span>
          </h2>
          <button
            type="button"
            className={styles.summaryButton}
            onClick={handleSummaryOpen}
            disabled={opinions.length === 0 || isSummaryLoading}
          >
            {isSummaryLoading ? '요약 중...' : '의견 요약'}
          </button>
        </div>
        <dl className={styles.counts} aria-label="의견 현황">
          <div>
            <dt>찬성</dt>
            <dd>{opinionCounts.AGREE}</dd>
          </div>
          <div>
            <dt>조건부</dt>
            <dd>{opinionCounts.CONDITIONAL}</dd>
          </div>
          <div>
            <dt>반대</dt>
            <dd>{opinionCounts.DISAGREE}</dd>
          </div>
        </dl>
        <OpinionList
          opinions={opinions}
          currentUserId={currentUser.id}
          onDelete={handleOpinionDelete}
        />
      </section>

      <ConsensusSummaryModal
        isOpen={isSummaryOpen}
        isLoading={isSummaryLoading}
        consensus={consensus}
        error={summaryError}
        onClose={handleSummaryClose}
        onRetry={() => void loadSummary()}
      />
    </main>
  )
}

export default ConsensusDevPage
