import type {
  ConsensusSummary,
  OpinionCategorySummary,
} from '../types/consensus'
import type { Opinion, OpinionType } from '../types/opinion'

export const mockConsensus: ConsensusSummary = {
  id: 'consensus-1',
  proposalId: 'proposal-1',
  summary:
    '팀원들은 제안의 방향에는 대체로 공감하지만, 현재 일정 안에서 안정적으로 구현하려면 MVP 범위를 조정해야 한다고 보고 있습니다.',
  agree: {
    summary:
      '제안된 협업 흐름이 명확하고 핵심 기능과 초기 사용자 반응을 빠르게 검증할 수 있다는 점을 긍정적으로 평가했습니다.',
    count: 1,
  },
  disagree: {
    summary:
      '현재 기능 범위에 비해 개발 일정이 짧아 충분한 품질 검증과 테스트 시간을 확보하기 어렵다는 우려가 있습니다.',
    count: 1,
  },
  conditional: {
    summary:
      '부가 기능을 다음 단계로 이동하고 MVP를 핵심 사용자 흐름으로 제한한다면 진행할 수 있다는 의견입니다.',
    count: 1,
  },
  recommendation:
    'MVP 범위를 핵심 사용자 흐름으로 축소하고 확보된 테스트 일정을 팀에 공유한 뒤 최종 의견을 다시 확인하세요.',
  generatedAt: new Date().toISOString(),
}

const categoryLabels: Record<OpinionType, string> = {
  AGREE: '찬성',
  CONDITIONAL: '조건부 찬성',
  DISAGREE: '반대',
}

const summarizeCategory = (
  opinions: Opinion[],
  type: OpinionType,
): OpinionCategorySummary | undefined => {
  const categoryOpinions = opinions.filter((opinion) => opinion.type === type)

  if (categoryOpinions.length === 0) {
    return undefined
  }

  const highlights = categoryOpinions
    .slice(0, 2)
    .map((opinion) => `“${opinion.comment}”`)
    .join(', ')

  return {
    count: categoryOpinions.length,
    summary: `${categoryLabels[type]} ${categoryOpinions.length}건의 핵심 의견은 ${highlights}입니다.`,
  }
}

export function generateMockConsensus(
  opinions: Opinion[],
  proposalId = 'proposal-1',
): ConsensusSummary {
  const agreeCount = opinions.filter((opinion) => opinion.type === 'AGREE').length
  const conditionalCount = opinions.filter(
    (opinion) => opinion.type === 'CONDITIONAL',
  ).length
  const disagreeCount = opinions.filter(
    (opinion) => opinion.type === 'DISAGREE',
  ).length
  const supportiveCount = agreeCount + conditionalCount
  const direction =
    supportiveCount > disagreeCount
      ? '제안의 방향에 대체로 공감하고 있습니다.'
      : disagreeCount > supportiveCount
        ? '현재 제안에 대한 우려가 더 크게 나타났습니다.'
        : '찬성과 우려가 비슷해 추가 논의가 필요합니다.'

  return {
    id: `consensus-${Date.now()}`,
    proposalId,
    summary: `총 ${opinions.length}개의 의견을 종합하면 팀은 ${direction}`,
    agree: summarizeCategory(opinions, 'AGREE'),
    conditional: summarizeCategory(opinions, 'CONDITIONAL'),
    disagree: summarizeCategory(opinions, 'DISAGREE'),
    recommendation:
      disagreeCount > 0 || conditionalCount > 0
        ? '반대 및 조건부 의견에 담긴 우려를 확인하고, 범위와 일정을 조정한 뒤 팀에 다시 공유하세요.'
        : '현재 공감대를 바탕으로 담당자와 다음 실행 일정을 확정하세요.',
    generatedAt: new Date().toISOString(),
  }
}

export function requestMockConsensus(opinions: Opinion[]) {
  return new Promise<ConsensusSummary>((resolve) => {
    window.setTimeout(() => resolve(generateMockConsensus(opinions)), 700)
  })
}
