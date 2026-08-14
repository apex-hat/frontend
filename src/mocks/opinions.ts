import type { Opinion } from '../types/opinion'

const getMockCreatedAt = (minutesAgo: number) =>
  new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()

export const mockOpinions: Opinion[] = [
  {
    id: 'opinion-1',
    author: {
      id: 'member-1',
      name: 'Mina Kim',
      company: 'Meridian Labs',
      country: '대한민국',
      culturalRegion: '동아시아',
    },
    type: 'AGREE',
    comment: '현재 일정이라면 제안된 범위로 진행할 수 있습니다.',
    createdAt: getMockCreatedAt(40),
  },
  {
    id: 'opinion-2',
    author: {
      id: 'member-2',
      name: 'Alex Morgan',
      company: 'Northstar Studio',
      country: '미국',
      culturalRegion: '북아메리카',
    },
    type: 'CONDITIONAL_AGREE',
    comment: 'MVP 기능을 핵심 흐름으로 제한한다면 찬성합니다.',
    createdAt: getMockCreatedAt(95),
  },
  {
    id: 'opinion-3',
    author: {
      id: 'member-3',
      name: 'Sofia Garcia',
      company: 'Lumen Works',
      country: '스페인',
      culturalRegion: '남유럽',
    },
    type: 'DISAGREE',
    comment: '현재 개발 일정으로는 충분한 테스트 시간을 확보하기 어렵습니다.',
    createdAt: getMockCreatedAt(180),
  },
]
