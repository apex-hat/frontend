import { mockOpinions } from '../mocks/opinions'
import { MOCK_OPINIONS, MOCK_USERS } from '../features/dashboard/data/mockData'
import type { Opinion } from '../types/opinion'

const getStorageKey = (proposalId: string) =>
  `meridian:${proposalId}:opinions`

const isOpinion = (value: unknown): value is Opinion => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const opinion = value as Partial<Opinion>

  return (
    typeof opinion.id === 'string' &&
    typeof opinion.author?.id === 'string' &&
    ['AGREE', 'CONDITIONAL', 'DISAGREE'].includes(opinion.type ?? '') &&
    typeof opinion.comment === 'string' &&
    typeof opinion.createdAt === 'string'
  )
}

export function loadStoredOpinions(proposalId: string): Opinion[] | null {
  try {
    const savedOpinions = window.localStorage.getItem(getStorageKey(proposalId))
    if (!savedOpinions) return null
    const parsedOpinions: unknown = JSON.parse(savedOpinions)
    return Array.isArray(parsedOpinions) && parsedOpinions.every(isOpinion)
      ? parsedOpinions
      : null
  } catch {
    return null
  }
}

export function loadOpinions(proposalId: string): Opinion[] {
  try {
    const storedOpinions = loadStoredOpinions(proposalId)

    if (!storedOpinions) {
      const dashboardOpinions = MOCK_OPINIONS.filter(
        (opinion) => opinion.proposal_id === proposalId,
      ).map((opinion) => {
        const author = MOCK_USERS.find((user) => user.id === opinion.user_id)
        return {
          id: opinion.id,
          author: {
            id: opinion.user_id,
            name: author?.name ?? '팀원',
            company: 'Meridian',
            country: author?.country ?? '',
            culturalRegion: author?.culture_tag ?? '',
          },
          type: opinion.stance,
          comment: opinion.comment ?? '',
          createdAt: opinion.created_at,
        } satisfies Opinion
      })

      if (dashboardOpinions.length > 0) return dashboardOpinions
      return ['1', '2', '3'].includes(proposalId) ? [...mockOpinions] : []
    }

    return storedOpinions
  } catch {
    return [...mockOpinions]
  }
}

export function saveOpinions(proposalId: string, opinions: Opinion[]) {
  window.localStorage.setItem(
    getStorageKey(proposalId),
    JSON.stringify(opinions),
  )
}
