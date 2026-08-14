// DB 스키마 / API 명세와 1:1로 맞춘 공통 데이터 계약.
// 다른 프론트(제안 작성 + AI 문화 맥락 분석 / 비동기 의견 수집 + AI 합의 요약) 팀과 공유됩니다.
// 필드명은 스키마 그대로(snake_case) 유지하고, 카멜케이스 변환이 필요하면
// src/lib/api.ts 등 API 클라이언트 레이어에서만 처리합니다.

export type TeamRole = "PM" | "MEMBER";

export type ProposalStatus = "DRAFT" | "REVIEWING" | "OPEN" | "CONSENSUS_DONE" | "CLOSED";

export type Stance = "AGREE" | "DISAGREE" | "CONDITIONAL";

export type SupportedLanguage = "ko" | "en" | "ja" | "de" | "pt";

export type NotificationType =
  | "NEW_PROPOSAL"
  | "OPINION_REQUEST"
  | "DEADLINE_SOON"
  | "CONSENSUS_DONE";

export interface User {
  id: string;
  name: string;
  email: string;
  /** 항상 마스킹되어 내려오며 클라이언트에서 절대 원문을 다루지 않음 */
  password?: string;
  country: string;
  /** IANA 타임존, 예: "Asia/Seoul" */
  timezone: string;
  /** 예: "high-context", "low-context" */
  culture_tag: string;
  preferred_language: SupportedLanguage;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  country: string;
  culture_tag: string;
  created_at: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
}

export interface Proposal {
  id: string;
  title: string;
  target_team_id: string;
  status: ProposalStatus;
  deadline: string;
  created_at: string;
}

export interface Opinion {
  id: string;
  proposal_id: string;
  user_id: string;
  stance: Stance;
  comment?: string;
  original_language?: SupportedLanguage;
  translations?: Partial<Record<SupportedLanguage, string>>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  proposal_id: string | null;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
}

/** POST /api/auth/login, /api/auth/signup 응답 형태 */
export type AuthUser = Pick<
  User,
  "id" | "name" | "email" | "country" | "timezone" | "culture_tag" | "preferred_language"
>;
