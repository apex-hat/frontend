import { mockOpinions } from '../mocks/opinions'
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

export function loadOpinions(proposalId: string): Opinion[] {
  try {
    const savedOpinions = window.localStorage.getItem(getStorageKey(proposalId))

    if (!savedOpinions) {
      return [...mockOpinions]
    }

    const parsedOpinions: unknown = JSON.parse(savedOpinions)

    return Array.isArray(parsedOpinions) && parsedOpinions.every(isOpinion)
      ? parsedOpinions
      : [...mockOpinions]
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
