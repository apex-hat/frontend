export type OpinionType = 'AGREE' | 'DISAGREE' | 'CONDITIONAL'

export interface OpinionAuthor {
  id: string
  name: string
  company?: string
  country?: string
  culturalRegion?: string
}

export interface Opinion {
  id: string
  author: OpinionAuthor
  type: OpinionType
  comment: string
  createdAt: string
  updatedAt?: string
}

export interface OpinionDraft {
  type: OpinionType
  comment: string
}
