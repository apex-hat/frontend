export interface OpinionCategorySummary {
  summary: string
}

export interface ConsensusSummary {
  id: string
  proposalId: string
  summary: string
  agree?: OpinionCategorySummary
  disagree?: OpinionCategorySummary
  conditional?: OpinionCategorySummary
  recommendation: string
  generatedAt: string
}
