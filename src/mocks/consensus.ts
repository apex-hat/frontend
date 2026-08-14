import type { ConsensusSummary, OpinionCategorySummary } from '../types/consensus'
import type { Opinion, OpinionType } from '../types/opinion'

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
    .map((opinion) => opinion.comment)
    .join(' ')

  return {
    summary: highlights,
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
  const conditionalConcern = opinions.find(
    (opinion) => opinion.type === 'CONDITIONAL',
  )?.comment.replace(/[.!?。]+$/, '')
  const disagreeConcern = opinions.find(
    (opinion) => opinion.type === 'DISAGREE',
  )?.comment.replace(/[.!?。]+$/, '')
  const direction =
    supportiveCount > disagreeCount
      ? '제안의 방향에 대체로 공감하고 있습니다.'
      : disagreeCount > supportiveCount
        ? '현재 제안에 대한 우려가 더 크게 나타났습니다.'
        : '찬성과 우려가 비슷해 추가 논의가 필요합니다.'
  let nextStep =
    '현재 공감대를 바탕으로 담당자와 다음 실행 일정을 확정하면 좋겠습니다.'

  if (conditionalConcern && disagreeConcern) {
    nextStep = `다만 조건부 의견에서는 “${conditionalConcern}”라는 조건이 제시되었고, 반대 의견에서는 “${disagreeConcern}”라는 우려가 있어 범위와 일정을 조정해 팀에 다시 공유할 필요가 있습니다.`
  } else if (conditionalConcern) {
    nextStep = `다만 조건부 의견에서 “${conditionalConcern}”라는 조건이 제시되어, 이를 반영한 범위와 일정을 팀에 다시 공유할 필요가 있습니다.`
  } else if (disagreeConcern) {
    nextStep = `다만 반대 의견에서 “${disagreeConcern}”라는 우려가 있어 범위와 일정을 조정해 팀에 다시 공유할 필요가 있습니다.`
  }

  return {
    id: `consensus-${Date.now()}`,
    proposalId,
    summary: `팀은 ${direction} ${nextStep}`,
    agree: summarizeCategory(opinions, 'AGREE'),
    conditional: summarizeCategory(opinions, 'CONDITIONAL'),
    disagree: summarizeCategory(opinions, 'DISAGREE'),
    recommendation: nextStep,
    generatedAt: new Date().toISOString(),
  }
}

export function requestMockConsensus(opinions: Opinion[]) {
  return new Promise<ConsensusSummary>((resolve) => {
    window.setTimeout(() => resolve(generateMockConsensus(opinions)), 700)
  })
}
