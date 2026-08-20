export type ConsensusStatus = "AGREED" | "PARTIAL" | "DISAGREED" | "PENDING"

export interface ConsensusSummary {
  id: string
  proposalId: string
  consensusStatus: ConsensusStatus
  summary: string
  keyIssues: string[]
  culturalAnalysis: string[]
  hiddenOpposition: string[]
  recommendedActions: string
  generatedAt: string
}
