import { useEffect, useState } from 'react'
import ConsensusSummaryModal from '../../components/consensus/ConsensusSummaryModal'
import OpinionForm from '../../components/opinion/OpinionForm'
import OpinionList from '../../components/opinion/OpinionList'
import { mockConsensus } from '../../mocks/consensus'
import { mockOpinions } from '../../mocks/opinions'
import type { Opinion, OpinionAuthor } from '../../types/opinion'
import styles from './ConsensusDevPage.module.css'

const currentUser: OpinionAuthor = {
  id: 'current-user',
  name: '현재 사용자',
  company: 'Meridian',
  country: '대한민국',
  culturalRegion: '동아시아',
}

function ConsensusDevPage() {
  const [opinions, setOpinions] = useState<Opinion[]>(() => [...mockOpinions])
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)

  useEffect(() => {
    if (!isSummaryLoading) {
      return
    }

    const loadingTimer = window.setTimeout(() => {
      setIsSummaryLoading(false)
    }, 700)

    return () => window.clearTimeout(loadingTimer)
  }, [isSummaryLoading])

  const handleOpinionSubmit = (opinion: Opinion) => {
    setOpinions((currentOpinions) => [opinion, ...currentOpinions])
  }

  const handleSummaryOpen = () => {
    setIsSummaryOpen(true)
    setIsSummaryLoading(true)
  }

  const handleSummaryClose = () => {
    setIsSummaryOpen(false)
    setIsSummaryLoading(false)
  }

  return (
    <main className={styles.page} data-consensus-dev-page>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>의견 작성</h1>
      </header>

      <section className={styles.section} aria-label="의견 작성 폼">
        <OpinionForm author={currentUser} onSubmit={handleOpinionSubmit} />
      </section>

      <section className={styles.section} aria-labelledby="opinion-list-title">
        <div className={styles.listHeader}>
          <h2 id="opinion-list-title" className={styles.sectionTitle}>
            팀원 의견
          </h2>
          <button
            type="button"
            className={styles.summaryButton}
            onClick={handleSummaryOpen}
          >
            의견 요약
          </button>
        </div>
        <OpinionList opinions={opinions} />
      </section>

      <ConsensusSummaryModal
        isOpen={isSummaryOpen}
        isLoading={isSummaryLoading}
        consensus={mockConsensus}
        onClose={handleSummaryClose}
      />
    </main>
  )
}

export default ConsensusDevPage
