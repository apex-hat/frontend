import type { ConsensusSummary } from '../types/consensus'

export const mockConsensus: ConsensusSummary = {
  id: 'consensus-1',
  proposalId: 'proposal-1',
  summary:
    '팀원들은 제안의 방향에는 대체로 공감하지만, 현재 일정 안에서 안정적으로 구현하려면 MVP 범위를 조정해야 한다고 보고 있습니다.',
  agree: {
    summary:
      '제안된 협업 흐름이 명확하고 핵심 기능과 초기 사용자 반응을 빠르게 검증할 수 있다는 점을 긍정적으로 평가했습니다.',
  },
  disagree: {
    summary:
      '현재 기능 범위에 비해 개발 일정이 짧아 충분한 품질 검증과 테스트 시간을 확보하기 어렵다는 우려가 있습니다.',
  },
  conditional: {
    summary:
      '부가 기능을 다음 단계로 이동하고 MVP를 핵심 사용자 흐름으로 제한한다면 진행할 수 있다는 의견입니다.',
  },
  recommendation:
    'MVP 범위를 핵심 사용자 흐름으로 축소하고 확보된 테스트 일정을 팀에 공유한 뒤 최종 의견을 다시 확인하세요.',
  generatedAt: new Date().toISOString(),
}
