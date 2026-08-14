import type { Notification, Opinion, Proposal, Team, TeamMember, User } from "../../../types";

// 실제 서비스에서는 /api/teams, /api/dashboard/timezones, /api/dashboard/status,
// /api/notifications 로 대체될 목데이터. 필드명/enum은 DB 스키마와 100% 동일하게 맞춤.
// 시연 시 "지금" 기준으로 자연스러워 보이도록 시각은 매번 상대값으로 계산합니다.

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
const hoursFromNow = (h: number) => new Date(Date.now() + h * 60 * 60 * 1000).toISOString();

export const CURRENT_USER_ID = "u-jiwoo";

export const MOCK_TEAM: Team = {
  id: "t-1",
  name: "Meridian Core",
  country: "KR",
  culture_tag: "high-context",
  created_at: hoursAgo(24 * 90),
};

export const MOCK_USERS: User[] = [
  { id: "u-jiwoo", name: "테스트유저", email: "test@meridian.team", country: "KR", timezone: "Asia/Seoul", culture_tag: "high-context", preferred_language: "ko", created_at: hoursAgo(24 * 90) },
  { id: "u-mina", name: "이민아", email: "mina@meridian.team", country: "KR", timezone: "Asia/Seoul", culture_tag: "high-context", preferred_language: "ko", created_at: hoursAgo(24 * 88) },
  { id: "u-alex", name: "Alex Turner", email: "alex@meridian.team", country: "US", timezone: "America/Los_Angeles", culture_tag: "low-context", preferred_language: "en", created_at: hoursAgo(24 * 80) },
  { id: "u-sofia", name: "Sofia Almeida", email: "sofia@meridian.team", country: "BR", timezone: "America/Sao_Paulo", culture_tag: "high-context", preferred_language: "pt", created_at: hoursAgo(24 * 75) },
  { id: "u-lena", name: "Lena Schmidt", email: "lena@meridian.team", country: "DE", timezone: "Europe/Berlin", culture_tag: "low-context", preferred_language: "de", created_at: hoursAgo(24 * 70) },
  { id: "u-omar", name: "Omar Haddad", email: "omar@meridian.team", country: "GB", timezone: "Europe/London", culture_tag: "low-context", preferred_language: "en", created_at: hoursAgo(24 * 60) },
  { id: "u-haruto", name: "佐藤 陽翔", email: "haruto@meridian.team", country: "JP", timezone: "Asia/Tokyo", culture_tag: "high-context", preferred_language: "ja", created_at: hoursAgo(24 * 50) },
  { id: "u-priya", name: "Priya Nair", email: "priya@meridian.team", country: "IN", timezone: "Asia/Kolkata", culture_tag: "high-context", preferred_language: "en", created_at: hoursAgo(24 * 40) },
  { id: "u-jack", name: "Jack Wilson", email: "jack@meridian.team", country: "AU", timezone: "Australia/Sydney", culture_tag: "low-context", preferred_language: "en", created_at: hoursAgo(24 * 30) },
];

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { team_id: "t-1", user_id: "u-jiwoo", role: "PM", joined_at: hoursAgo(24 * 90) },
  { team_id: "t-1", user_id: "u-mina", role: "MEMBER", joined_at: hoursAgo(24 * 88) },
  { team_id: "t-1", user_id: "u-alex", role: "MEMBER", joined_at: hoursAgo(24 * 80) },
  { team_id: "t-1", user_id: "u-sofia", role: "MEMBER", joined_at: hoursAgo(24 * 75) },
  { team_id: "t-1", user_id: "u-lena", role: "MEMBER", joined_at: hoursAgo(24 * 70) },
  { team_id: "t-1", user_id: "u-omar", role: "MEMBER", joined_at: hoursAgo(24 * 60) },
  { team_id: "t-1", user_id: "u-haruto", role: "MEMBER", joined_at: hoursAgo(24 * 50) },
  { team_id: "t-1", user_id: "u-priya", role: "MEMBER", joined_at: hoursAgo(24 * 40) },
  { team_id: "t-1", user_id: "u-jack", role: "MEMBER", joined_at: hoursAgo(24 * 30) },
];

/** 아바타 배경색 — UI 전용 목데이터, DB 스키마에는 없는 필드라 별도 맵으로 분리 */
export const AVATAR_COLORS: Record<string, string> = {
  "u-jiwoo": "#F2A65A",
  "u-mina": "#63C7A6",
  "u-alex": "#7C8FE0",
  "u-sofia": "#E8607A",
  "u-lena": "#F2A65A",
  "u-omar": "#63C7A6",
  "u-haruto": "#7C8FE0",
  "u-priya": "#E8607A",
  "u-jack": "#F2A65A",
};

export const MOCK_PROPOSALS: Proposal[] = [
  {
    id: "p-1",
    title: "온보딩 문서를 비디오 대신 인터랙티브 체크리스트로 전환하자",
    target_team_id: "t-1",
    status: "OPEN",
    deadline: hoursFromNow(18),
    created_at: hoursAgo(30),
  },
  {
    id: "p-2",
    title: "주간 스탠드업을 비동기 텍스트 업데이트로 전환",
    target_team_id: "t-1",
    status: "OPEN",
    deadline: hoursFromNow(36),
    created_at: hoursAgo(12),
  },
  {
    id: "p-3",
    title: "코드 리뷰 SLA를 24시간에서 48시간으로 조정",
    target_team_id: "t-1",
    status: "CONSENSUS_DONE",
    deadline: hoursAgo(2),
    created_at: hoursAgo(52),
  },
];

export const MOCK_OPINIONS: Opinion[] = [
  // p-1: 온보딩 문서 전환 — u-sofia, u-haruto, u-priya, u-jack 미응답
  { id: "o-1", proposal_id: "p-1", user_id: "u-jiwoo", stance: "AGREE", comment: "제작 비용도 줄고 유지보수도 쉬워질 것 같아요.", created_at: hoursAgo(30) },
  { id: "o-2", proposal_id: "p-1", user_id: "u-mina", stance: "AGREE", comment: "체크리스트 UI 시안 바로 만들어볼게요.", created_at: hoursAgo(28) },
  { id: "o-3", proposal_id: "p-1", user_id: "u-alex", stance: "CONDITIONAL", comment: "완전히 반대는 아닌데, 기존 신규 입사자 설문에서 영상 선호가 높았던 게 걸려요.", created_at: hoursAgo(20) },
  { id: "o-4", proposal_id: "p-1", user_id: "u-lena", stance: "DISAGREE", comment: "흥미로운 아이디어지만, 우리 팀 온보딩엔 아직 시기상조인 것 같습니다.", created_at: hoursAgo(10) },
  {
    id: "o-5",
    proposal_id: "p-1",
    user_id: "u-omar",
    stance: "AGREE",
    comment: "Sounds good to me.",
    original_language: "en",
    translations: {
      ko: "좋은 방향이라고 생각합니다.",
      ja: "良い方向性だと思います。",
      de: "Ich halte das für eine gute Richtung.",
      pt: "Acho que é uma boa direção.",
    },
    created_at: hoursAgo(9),
  },

  // p-2: 스탠드업 비동기 전환 — u-jiwoo, u-mina, u-alex, u-sofia, u-priya, u-jack 미응답
  { id: "o-6", proposal_id: "p-2", user_id: "u-lena", stance: "AGREE", comment: "시차 때문에 실시간 참석이 항상 힘들었어요.", created_at: hoursAgo(12) },
  {
    id: "o-7",
    proposal_id: "p-2",
    user_id: "u-omar",
    stance: "AGREE",
    comment: "Async updates work much better for my timezone.",
    original_language: "en",
    translations: {
      ko: "제 시간대에는 비동기 업데이트 방식이 훨씬 잘 맞습니다.",
      ja: "私のタイムゾーンには非同期更新の方がずっと合っています。",
      de: "Asynchrone Updates passen viel besser zu meiner Zeitzone.",
      pt: "Atualizações assíncronas funcionam muito melhor no meu fuso horário.",
    },
    created_at: hoursAgo(11),
  },
  { id: "o-8", proposal_id: "p-2", user_id: "u-haruto", stance: "CONDITIONAL", comment: "월요일만 화상으로 유지하면 좋겠어요.", created_at: hoursAgo(6) },

  // p-3: 코드 리뷰 SLA — 전원 응답 완료(합의)
  { id: "o-9", proposal_id: "p-3", user_id: "u-jiwoo", stance: "AGREE", comment: "리뷰 품질을 유지하려면 48시간이 현실적인 기준이라고 생각합니다.", created_at: hoursAgo(50) },
  { id: "o-10", proposal_id: "p-3", user_id: "u-mina", stance: "CONDITIONAL", comment: "긴급 리뷰를 별도로 표시하는 조건이라면 48시간 기준에 동의해요.", created_at: hoursAgo(49) },
  { id: "o-11", proposal_id: "p-3", user_id: "u-alex", stance: "AGREE", comment: "시차를 고려하면 48시간이 모든 지역의 팀원에게 더 공평합니다.", created_at: hoursAgo(52) },
  { id: "o-12", proposal_id: "p-3", user_id: "u-sofia", stance: "DISAGREE", comment: "48시간은 긴급한 작업의 병목을 키울 수 있어 기존 기준을 유지하는 편이 좋겠습니다.", created_at: hoursAgo(44) },
  { id: "o-13", proposal_id: "p-3", user_id: "u-lena", stance: "AGREE", comment: "현재 업무량을 보면 24시간보다 48시간이 안정적이에요.", created_at: hoursAgo(40) },
  { id: "o-14", proposal_id: "p-3", user_id: "u-omar", stance: "CONDITIONAL", comment: "명확한 우선순위 규칙을 함께 적용하는 조건으로 동의합니다.", created_at: hoursAgo(38) },
  { id: "o-15", proposal_id: "p-3", user_id: "u-haruto", stance: "AGREE", comment: "리뷰 요청이 밤에 도착하는 경우가 많아 변경에 동의합니다.", created_at: hoursAgo(30) },
  { id: "o-16", proposal_id: "p-3", user_id: "u-priya", stance: "DISAGREE", comment: "리뷰 대기 시간이 길어질 수 있어 24시간 기준을 유지하는 편이 낫다고 생각합니다.", created_at: hoursAgo(20) },
  { id: "o-17", proposal_id: "p-3", user_id: "u-jack", stance: "AGREE", comment: "팀 전체 기준을 통일하는 방향에 찬성합니다.", created_at: hoursAgo(15) },
];

// 주의: 이미 응답(Opinions에 레코드 있음)한 사용자에게는 OPINION_REQUEST 알림을 만들지 않음.
// u-jiwoo는 p-1에 이미 응답했으므로 p-1에 대한 OPINION_REQUEST가 없고, DEADLINE_SOON만 존재.
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n-friend-1",
    user_id: "u-jiwoo",
    proposal_id: null,
    type: "FRIEND_REQUEST",
    message: "Nora Kim님이 친구 요청을 보냈습니다.",
    is_read: false,
    created_at: hoursAgo(1),
  },
  {
    id: "n-1",
    user_id: "u-jiwoo",
    proposal_id: "p-2",
    type: "OPINION_REQUEST",
    message: "'주간 스탠드업 전환' 제안에 의견을 남겨주세요.",
    is_read: false,
    created_at: hoursAgo(11),
  },
  {
    id: "n-2",
    user_id: "u-jiwoo",
    proposal_id: "p-1",
    type: "DEADLINE_SOON",
    message: "'온보딩 문서 전환' 제안, 마감까지 18시간 남았어요.",
    is_read: false,
    created_at: hoursAgo(2),
  },
  {
    id: "n-3",
    user_id: "u-jiwoo",
    proposal_id: "p-3",
    type: "CONSENSUS_DONE",
    message: "'코드 리뷰 SLA 조정' 제안의 합의 절차가 마무리됐어요.",
    is_read: true,
    created_at: hoursAgo(15),
  },
  {
    id: "n-4",
    user_id: "u-jiwoo",
    proposal_id: "p-2",
    type: "NEW_PROPOSAL",
    message: "'주간 스탠드업 전환' 제안이 새로 등록됐어요.",
    is_read: true,
    created_at: hoursAgo(12),
  },
];
