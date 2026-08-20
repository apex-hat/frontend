import { useEffect, useMemo, useState } from 'react'
import ConsensusSummaryModal from '../../components/consensus/ConsensusSummaryModal'
import OpinionForm from '../../components/opinion/OpinionForm'
import OpinionList from '../../components/opinion/OpinionList'
import {
  createOpinion,
  deleteOpinion,
  getOpinions,
  getTeamMembers,
  InsufficientResponsesError,
  postConsensusSummary,
  updateOpinion,
  type TeamMemberProfile,
} from '../../lib/api'
import type { ConsensusSummary } from '../../types/consensus'
import type {
  Opinion,
  OpinionAuthor,
  OpinionDraft,
  OpinionType,
} from '../../types/opinion'
import styles from './ConsensusDevPage.module.css'

interface Props {
  proposalId: string
  proposalTitle: string
  proposalDescription: string
  proposalAuthorName?: string
  isProposalAuthor?: boolean
  targetTeamId: string
  currentUser: OpinionAuthor
  teamMemberCount: number
  /** 작성자 본인이고 아직 합의가 확정되지 않은 제안일 때만 넘겨준다 (수정/삭제 버튼 노출용) */
  canManageProposal?: boolean
  onEditProposal?: () => void
  onDeleteProposal?: () => Promise<void>
}

/**
 * 작성자 표시는 Backend가 OpinionResponse에 함께 내려주는 프로필(userName/userCountry/userCultureTag)을 우선 쓴다.
 * 팀원 목록(members)은 그 값이 비어있을 때만 보강용으로 쓰고, 그마저 없으면(예: 이미 팀을 나간 사용자) '팀원'으로 표시한다.
 */
function toDisplayOpinions(
  apiOpinions: Array<{
    id: string
    user_id: string
    user_name?: string
    user_country?: string
    user_culture_tag?: string
    stance: OpinionType
    comment?: string
    created_at: string
    updated_at?: string
  }>,
  members: TeamMemberProfile[],
  currentUser: OpinionAuthor,
): Opinion[] {
  const memberById = new Map(members.map((member) => [member.user_id, member]))
  return apiOpinions.map((opinion) => {
    const member = memberById.get(opinion.user_id)
    const author: OpinionAuthor =
      opinion.user_id === currentUser.id
        ? currentUser
        : {
            id: opinion.user_id,
            name: opinion.user_name ?? member?.name ?? '팀원',
            company: 'Meridian',
            country: opinion.user_country ?? member?.country,
            culturalRegion: opinion.user_culture_tag ?? member?.culture_tag,
          }

    return {
      id: opinion.id,
      author,
      type: opinion.stance,
      comment: opinion.comment ?? '',
      createdAt: opinion.created_at,
      updatedAt: opinion.updated_at && opinion.updated_at !== opinion.created_at ? opinion.updated_at : undefined,
    }
  })
}

type OpinionFilter = OpinionType | null

const filterOptions: Array<{ value: OpinionType; label: string }> = [
  { value: 'AGREE', label: '찬성' },
  { value: 'CONDITIONAL_AGREE', label: '조건부' },
  { value: 'DISAGREE', label: '반대' },
]

function ConsensusDevPage({
  proposalId,
  proposalTitle,
  proposalDescription,
  proposalAuthorName,
  isProposalAuthor,
  targetTeamId,
  currentUser,
  teamMemberCount,
  canManageProposal,
  onEditProposal,
  onDeleteProposal,
}: Props) {
  const [opinions, setOpinions] = useState<Opinion[]>([])
  const [members, setMembers] = useState<TeamMemberProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [opinionFilter, setOpinionFilter] = useState<OpinionFilter>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formStatus, setFormStatus] = useState<string | null>(null)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [consensus, setConsensus] = useState<ConsensusSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Opinion | null>(null)
  const [isProposalDeleteOpen, setIsProposalDeleteOpen] = useState(false)
  const [isDeletingProposal, setIsDeletingProposal] = useState(false)

  useEffect(() => {
    let cancelled = false

    Promise.all([getOpinions(proposalId), getTeamMembers(targetTeamId)])
      .then(([apiOpinions, teamMembers]) => {
        if (cancelled) return
        setMembers(teamMembers)
        setOpinions(toDisplayOpinions(apiOpinions, teamMembers, currentUser))
        setLoadError(null)
      })
      .catch(() => {
        if (!cancelled) setLoadError('의견을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
    // currentUser는 매 렌더마다 새 객체로 내려오는 prop이라 currentUser.id(안정적인 값)만 의존성으로 둔다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId, targetTeamId, currentUser.id])

  const currentUserOpinion = opinions.find(
    (opinion) => opinion.author.id === currentUser.id,
  )
  const isCurrentUserPm = members.find((member) => member.user_id === currentUser.id)?.role === 'PM'
  const opinionCounts = useMemo(
    () =>
      opinions.reduce<Record<OpinionType, number>>(
        (counts, opinion) => ({
          ...counts,
          [opinion.type]: counts[opinion.type] + 1,
        }),
        { AGREE: 0, CONDITIONAL_AGREE: 0, DISAGREE: 0 },
      ),
    [opinions],
  )
  const filteredOpinions = opinionFilter
    ? opinions.filter((opinion) => opinion.type === opinionFilter)
    : opinions
  const participantCount = new Set(
    opinions.map((opinion) => opinion.author.id),
  ).size

  const handleOpinionSubmit = async (draft: OpinionDraft) => {
    setIsSubmitting(true)
    setFormStatus(null)

    try {
      if (currentUserOpinion) {
        await updateOpinion(currentUserOpinion.id, draft.type, draft.comment)
      } else {
        await createOpinion(proposalId, draft.type, draft.comment)
      }
      // Backend가 첫 의견 등록 시 Proposal을 OPEN -> IN_PROGRESS로 전이시키므로,
      // 의견 목록만 다시 받아오면 그 상태 변화는 다음 Dashboard 진입 시 자연히 반영된다.
      const freshOpinions = await getOpinions(proposalId)
      setOpinions(toDisplayOpinions(freshOpinions, members, currentUser))
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
    const isOwner = targetOpinion?.author.id === currentUser.id

    if (!targetOpinion || (!isOwner && !isCurrentUserPm)) {
      return
    }

    setDeleteTarget(targetOpinion)
  }

  const confirmOpinionDelete = async () => {
    if (!deleteTarget) return

    try {
      await deleteOpinion(deleteTarget.id)
      setOpinions((current) =>
        current.filter((opinion) => opinion.id !== deleteTarget.id),
      )
      setConsensus(null)
      setDeleteTarget(null)
      setFormStatus('내 의견을 삭제했습니다.')
    } catch {
      setFormStatus('의견을 삭제하지 못했습니다. 다시 시도해주세요.')
    }
  }

  const loadSummary = async () => {
    setIsSummaryLoading(true)
    setSummaryError(null)

    try {
      setConsensus(await postConsensusSummary(proposalId))
    } catch (error) {
      setSummaryError(
        error instanceof InsufficientResponsesError
          ? error.message
          : '의견 요약을 불러오지 못했습니다.',
      )
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

  const confirmProposalDelete = async () => {
    if (!onDeleteProposal) return
    setIsDeletingProposal(true)
    try {
      await onDeleteProposal()
    } finally {
      setIsDeletingProposal(false)
      setIsProposalDeleteOpen(false)
    }
  }

  return (
    <main className={styles.page} data-consensus-dev-page>
      <header className={styles.pageHeader}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>{proposalTitle}</h1>
            {proposalAuthorName && (
              <p className={styles.author}>
                작성자 {proposalAuthorName}{isProposalAuthor ? ' (나)' : ''}
              </p>
            )}
          </div>
          {canManageProposal && (
            <div className={styles.headerActions}>
              {onEditProposal && (
                <button type="button" className={styles.headerActionButton} onClick={onEditProposal}>
                  수정하기
                </button>
              )}
              {onDeleteProposal && (
                <button
                  type="button"
                  className={`${styles.headerActionButton} ${styles.headerActionDanger}`}
                  onClick={() => setIsProposalDeleteOpen(true)}
                >
                  삭제하기
                </button>
              )}
            </div>
          )}
        </div>
        <p className={styles.description}>{proposalDescription}</p>
      </header>

      {isLoading && <p className={styles.status} role="status">의견을 불러오는 중...</p>}
      {!isLoading && loadError && <p className={styles.status} role="alert">{loadError}</p>}

      {!isLoading && !loadError && (
      <>
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
            팀원 의견 <span>{participantCount}/{teamMemberCount}</span>
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
        <div className={styles.filters} aria-label="의견 유형 필터">
          {filterOptions.map((option) => {
            const count =
              opinionCounts[option.value]

            return (
              <button
                key={option.value}
                type="button"
                className={`${styles.filterButton} ${
                  opinionFilter === option.value ? styles.filterSelected : ''
                }`}
                aria-pressed={opinionFilter === option.value}
                onClick={() =>
                  setOpinionFilter((currentFilter) =>
                    currentFilter === option.value ? null : option.value,
                  )
                }
              >
                <span>{option.label}</span>
                <strong>{count}</strong>
              </button>
            )
          })}
        </div>
        <OpinionList
          opinions={filteredOpinions}
          currentUserId={currentUser.id}
          canManageAll={isCurrentUserPm}
          onDelete={handleOpinionDelete}
          emptyMessage={opinionFilter ? "선택한 유형의 의견이 아직 없습니다." : "아직 작성된 의견이 없습니다."}
        />
      </section>
      </>
      )}

      {deleteTarget && (
        <div className={styles.dialogBackdrop} role="presentation">
          <section
            className={styles.deleteDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-opinion-title"
          >
            <h2 id="delete-opinion-title">
              {deleteTarget.author.id === currentUser.id ? '내 의견을 삭제할까요?' : `${deleteTarget.author.name}님의 의견을 삭제할까요?`}
            </h2>
            <p className={styles.deletePreview}>{deleteTarget.comment}</p>
            <p className={styles.deleteNotice}>삭제한 의견은 복구할 수 없습니다.</p>
            <div className={styles.dialogActions}>
              <button type="button" onClick={() => setDeleteTarget(null)}>
                취소
              </button>
              <button
                type="button"
                className={styles.deleteConfirmButton}
                onClick={confirmOpinionDelete}
              >
                삭제
              </button>
            </div>
          </section>
        </div>
      )}

      {isProposalDeleteOpen && (
        <div className={styles.dialogBackdrop} role="presentation">
          <section
            className={styles.deleteDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-proposal-title"
          >
            <h2 id="delete-proposal-title">제안을 삭제할까요?</h2>
            <p className={styles.deletePreview}>{proposalTitle}</p>
            <p className={styles.deleteNotice}>등록된 의견과 응답 기록도 함께 삭제되며 복구할 수 없습니다.</p>
            <div className={styles.dialogActions}>
              <button type="button" onClick={() => setIsProposalDeleteOpen(false)} disabled={isDeletingProposal}>
                취소
              </button>
              <button
                type="button"
                className={styles.deleteConfirmButton}
                onClick={confirmProposalDelete}
                disabled={isDeletingProposal}
              >
                {isDeletingProposal ? '삭제하는 중…' : '삭제'}
              </button>
            </div>
          </section>
        </div>
      )}

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
