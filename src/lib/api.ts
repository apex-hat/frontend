import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { isAxiosError } from "axios";
import type { AuthUser, Notification, Opinion, Proposal, ProposalStatus, Stance, Team, TeamRole } from "../types";
import type { ConsensusSummary, ConsensusStatus } from "../types/consensus";
import { AVATAR_COLORS } from "../features/dashboard/data/mockData";
import { auth } from "./firebase";
import { httpClient } from "./httpClient";

// --- Auth -------------------------------------------------------------

/** Firebase Auth로 로그인한 뒤, JIT 동기화된 Backend 프로필을 조회해 반환한다. */
export async function login(email: string, password: string): Promise<AuthUser> {
  await signInWithEmailAndPassword(auth, email, password);
  return getMe();
}

/**
 * Firebase Auth로 계정을 만들고 JIT 동기화된 Backend 프로필을 조회한 뒤,
 * country/timezone은 PATCH /api/users/me로 채운다(JIT 동기화는 Firebase ID Token의
 * custom claim만 읽는데 클라이언트 SDK로는 custom claim을 설정할 수 없어서 여기서 별도 처리).
 */
export async function signup(name: string, email: string, password: string, country: string, timezone: string): Promise<AuthUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  // updateProfile은 이미 발급된 ID Token의 name claim을 갱신하지 않으므로, 강제로 새 토큰을 받아온다.
  await credential.user.getIdToken(true);
  await getMe();
  return updateCurrentUser({ country, timeZone: timezone });
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

interface UserMeResponse {
  id: number;
  name: string;
  email: string;
  country: string;
  timeZone: string;
  cultureTag: string;
}

/** GET /api/users/me — Backend는 camelCase라 여기서만 snake_case AuthUser로 매핑한다. */
export async function getMe(): Promise<AuthUser> {
  const { data } = await httpClient.get<UserMeResponse>("/api/users/me");
  return {
    id: String(data.id),
    // Firebase 계정에 displayName이 없으면 Backend name이 null로 내려올 수 있어 폴백을 둔다.
    name: data.name || data.email,
    email: data.email,
    country: data.country,
    timezone: data.timeZone,
    culture_tag: data.cultureTag,
    // Backend UserResponse에는 아직 preferred_language가 없어 기본값 사용
    preferred_language: "ko",
  };
}

interface UserUpdatePayload {
  name?: string;
  country?: string;
  timeZone?: string;
  location?: string;
  cultureTag?: string;
}

/** PATCH /api/users/me — 전달한 필드만 반영되는 부분 수정(값을 생략하면 기존 값 유지) */
export async function updateCurrentUser(payload: UserUpdatePayload): Promise<AuthUser> {
  const { data } = await httpClient.patch<UserMeResponse>("/api/users/me", payload);
  return {
    id: String(data.id),
    name: data.name || data.email,
    email: data.email,
    country: data.country,
    timezone: data.timeZone,
    culture_tag: data.cultureTag,
    preferred_language: "ko",
  };
}

// --- AI -------------------------------------------------------------

export interface IntentAnalysisResult {
  content: string;
  surfaceOpinion: string;
  potentialOpinion: string;
}

/** POST /api/ai/intent-analysis — 응답 필드는 공유 계약(types.ts) 대상이 아니라 Backend 그대로 사용 */
export async function postIntentAnalysis(content: string): Promise<IntentAnalysisResult> {
  const { data } = await httpClient.post<IntentAnalysisResult>("/api/ai/intent-analysis", { content });
  return data;
}

export interface CultureInterpretation {
  culture: string;
  interpretation: string;
}

export interface ContextAnalysisResult {
  id: string;
  originalText: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  interpretations: CultureInterpretation[];
  flaggedPhrases: string[];
  suggestion: string;
}

interface ContextAnalysisResponseDto {
  id: number;
  originalText: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  interpretations: CultureInterpretation[];
  flaggedPhrases: string[];
  suggestion: string;
}

/** POST /api/ai/context-analysis — proposalId 없이 등록 전에도 호출 가능(제안 등록 시 cultureAnalysisIds로 연결) */
export async function postContextAnalysis(originalText: string, targetCultures: string[]): Promise<ContextAnalysisResult> {
  const { data } = await httpClient.post<ContextAnalysisResponseDto>("/api/ai/context-analysis", {
    originalText,
    targetCultures,
  });
  return { ...data, id: String(data.id) };
}

interface ConsensusSummaryDto {
  id: number;
  proposalId: number;
  consensusStatus: ConsensusStatus;
  summary: string;
  keyIssues: string[];
  culturalAnalysis: string[];
  hiddenOpposition: string[];
  recommendedActions: string;
  createdAt: string;
}

export class InsufficientResponsesError extends Error {}

/**
 * POST /api/ai/consensus-summary — 대상 팀원 전원 응답 또는 deadline 경과 시에만 성공(409).
 * 조건 미충족이면 InsufficientResponsesError를 던진다(호출부에서 사용자 메시지로 구분해서 보여줄 것).
 */
export async function postConsensusSummary(proposalId: string): Promise<ConsensusSummary> {
  try {
    const { data } = await httpClient.post<ConsensusSummaryDto>("/api/ai/consensus-summary", {
      proposalId: Number(proposalId),
    });
    return {
      id: String(data.id),
      proposalId: String(data.proposalId),
      consensusStatus: data.consensusStatus,
      summary: data.summary,
      keyIssues: data.keyIssues,
      culturalAnalysis: data.culturalAnalysis,
      hiddenOpposition: data.hiddenOpposition,
      recommendedActions: data.recommendedActions,
      generatedAt: data.createdAt,
    };
  } catch (error) {
    if (isAxiosError(error) && error.response?.data?.error?.code === "INSUFFICIENT_RESPONSES") {
      throw new InsufficientResponsesError(error.response.data.error.message);
    }
    throw error;
  }
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

interface UserSummaryDto {
  id: number;
  name: string;
  email: string;
}

/** GET /api/users/search?email= — 팀원 초대 시 이메일로 상대의 userId를 찾는다. 없으면 null. */
export async function searchUserByEmail(email: string): Promise<UserSummary | null> {
  try {
    const { data } = await httpClient.get<UserSummaryDto>("/api/users/search", { params: { email } });
    return { id: String(data.id), name: data.name, email: data.email };
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

// --- Teams --------------------------------------------------------------

interface TeamResponseDto {
  id: number;
  name: string;
  country: string;
  cultureTag: string;
  createdAt: string;
}

function toTeam(dto: TeamResponseDto): Team {
  return {
    id: String(dto.id),
    name: dto.name,
    country: dto.country,
    culture_tag: dto.cultureTag,
    created_at: dto.createdAt,
  };
}

/** GET /api/teams — 로그인한 사용자가 속한 팀 목록 */
export async function getTeams(): Promise<Team[]> {
  const { data } = await httpClient.get<TeamResponseDto[]>("/api/teams");
  return data.map(toTeam);
}

/** POST /api/teams — 생성자는 Backend에서 자동으로 role=PM으로 등록됨 */
export async function createTeam(name: string, country: string, cultureTag: string): Promise<Team> {
  const { data } = await httpClient.post<TeamResponseDto>("/api/teams", { name, country, cultureTag });
  return toTeam(data);
}

/** GET /api/teams/{teamId} */
export async function getTeam(teamId: string): Promise<Team> {
  const { data } = await httpClient.get<TeamResponseDto>(`/api/teams/${teamId}`);
  return toTeam(data);
}

/** GET/POST /api/teams/{teamId}/members 응답 — 조인 row가 아니라 유저 프로필과 합쳐진 형태라 types.ts의 TeamMember와 다르다 */
export interface TeamMemberProfile {
  user_id: string;
  name: string;
  email: string;
  country: string;
  timezone: string;
  culture_tag: string;
  role: TeamRole;
  joined_at: string;
}

interface TeamMemberResponseDto {
  userId: number;
  name: string;
  email: string;
  country: string;
  timeZone: string;
  cultureTag: string;
  role: TeamRole;
  joinedAt: string;
}

function toTeamMemberProfile(dto: TeamMemberResponseDto): TeamMemberProfile {
  return {
    user_id: String(dto.userId),
    name: dto.name,
    email: dto.email,
    country: dto.country,
    timezone: dto.timeZone,
    culture_tag: dto.cultureTag,
    role: dto.role,
    joined_at: dto.joinedAt,
  };
}

/** GET /api/teams/{teamId}/members */
export async function getTeamMembers(teamId: string): Promise<TeamMemberProfile[]> {
  const { data } = await httpClient.get<TeamMemberResponseDto[]>(`/api/teams/${teamId}/members`);
  return data.map(toTeamMemberProfile);
}

/** POST /api/teams/{teamId}/members — 호출자는 해당 팀의 PM이어야 함 */
export async function addTeamMember(teamId: string, userId: string, role: TeamRole): Promise<TeamMemberProfile> {
  const { data } = await httpClient.post<TeamMemberResponseDto>(`/api/teams/${teamId}/members`, {
    userId: Number(userId),
    role,
  });
  return toTeamMemberProfile(data);
}

/** DELETE /api/teams/{teamId}/members/{userId} — 호출자는 해당 팀의 PM이어야 함 */
export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  await httpClient.delete(`/api/teams/${teamId}/members/${userId}`);
}

// --- Dashboard ------------------------------------------------------------

export interface TimezoneEntry {
  user_id: string;
  name: string;
  country: string;
  timezone: string;
  culture_tag: string;
  role: "PM" | "MEMBER";
  avatarColor: string;
}

interface DashboardTimezoneMemberDto {
  userId: number;
  country: string;
  timeZone: string;
  localTime: string;
  location: string;
}

/**
 * GET /api/dashboard/timezones — Backend 응답엔 country/timeZone만 있고 name/role/culture_tag가
 * 없어(README §10, 근거 없는 컬럼을 새로 만들지 않기로 한 결정), 이미 연동해둔 팀원 목록
 * (getTeamMembers)으로 보강한다. 근무 여부는 여전히 클라이언트에서 timezone 기준으로 파생한다.
 */
export async function getTimezones(teamId: string): Promise<TimezoneEntry[]> {
  const [{ data }, members] = await Promise.all([
    httpClient.get<{ members: DashboardTimezoneMemberDto[] }>("/api/dashboard/timezones", { params: { teamId: Number(teamId) } }),
    getTeamMembers(teamId),
  ]);
  const memberByUserId = new Map(members.map((member) => [member.user_id, member]));

  return data.members
    .map((dto) => {
      const member = memberByUserId.get(String(dto.userId));
      if (!dto.country || !dto.timeZone) return null;
      return {
        user_id: String(dto.userId),
        name: member?.name ?? "팀원",
        country: dto.country,
        timezone: dto.timeZone,
        culture_tag: member?.culture_tag ?? "",
        role: member?.role ?? "MEMBER",
        avatarColor: AVATAR_COLORS[String(dto.userId)] ?? "#7C8FE0",
      };
    })
    .filter((entry): entry is TimezoneEntry => entry !== null);
}

export interface ProposalStatusResult {
  proposal: Proposal;
  opinions: Opinion[];
}

/** 대응하는 단일 Backend endpoint가 없어, 실제 Proposal 상세 + Opinion 목록을 조합해 구성한다 */
export async function getProposalStatus(proposalId: string): Promise<ProposalStatusResult | null> {
  try {
    const [proposal, opinions] = await Promise.all([getProposal(proposalId), getOpinions(proposalId)]);
    return { proposal, opinions };
  } catch {
    return null;
  }
}

// --- Opinions -------------------------------------------------------------

interface OpinionResponseDto {
  id: number;
  proposalId: number;
  userId: number;
  stance: Stance;
  content: string;
  createdAt: string;
  updatedAt: string;
}

function toOpinion(dto: OpinionResponseDto): Opinion {
  return {
    id: String(dto.id),
    proposal_id: String(dto.proposalId),
    user_id: String(dto.userId),
    stance: dto.stance,
    comment: dto.content,
    created_at: dto.createdAt,
    updated_at: dto.updatedAt,
  };
}

/** GET /api/proposals/{proposalId}/opinions */
export async function getOpinions(proposalId: string): Promise<Opinion[]> {
  const { data } = await httpClient.get<OpinionResponseDto[]>(`/api/proposals/${proposalId}/opinions`);
  return data.map(toOpinion);
}

/** POST /api/proposals/{proposalId}/opinions — 1인 1의견 제약(409), OPEN/IN_PROGRESS 상태에서만 허용(409) */
export async function createOpinion(proposalId: string, stance: Stance, content: string): Promise<Opinion> {
  const { data } = await httpClient.post<OpinionResponseDto>(`/api/proposals/${proposalId}/opinions`, { stance, content });
  return toOpinion(data);
}

/** PUT /api/opinions/{opinionId} — 작성자 본인만 가능(그 외 403, Backend가 그대로 검증) */
export async function updateOpinion(opinionId: string, stance: Stance, content: string): Promise<Opinion> {
  const { data } = await httpClient.put<OpinionResponseDto>(`/api/opinions/${opinionId}`, { stance, content });
  return toOpinion(data);
}

/** DELETE /api/opinions/{opinionId} — 작성자 본인만 가능(그 외 403, Backend가 그대로 검증) */
export async function deleteOpinion(opinionId: string): Promise<void> {
  await httpClient.delete(`/api/opinions/${opinionId}`);
}

interface ProposalResponseDto {
  id: number;
  title: string;
  content: string;
  authorId: number;
  targetTeamId: number;
  status: ProposalStatus;
  targetCultures: string[];
  deadline: string;
  completedAt: string | null;
  createdAt: string;
}

function toProposal(dto: ProposalResponseDto): Proposal {
  return {
    id: String(dto.id),
    title: dto.title,
    content: dto.content,
    author_id: String(dto.authorId),
    target_team_id: String(dto.targetTeamId),
    status: dto.status,
    target_cultures: dto.targetCultures,
    deadline: dto.deadline,
    created_at: dto.createdAt,
    completed_at: dto.completedAt ?? undefined,
  };
}

/** GET /api/proposals — Backend가 인증된 사용자 기준으로 알아서 필터링하므로 teamId 파라미터가 없다 */
export async function getProposals(): Promise<Proposal[]> {
  const { data } = await httpClient.get<ProposalResponseDto[]>("/api/proposals");
  return data.map(toProposal);
}

/** GET /api/proposals/{proposalId} */
export async function getProposal(proposalId: string): Promise<Proposal> {
  const { data } = await httpClient.get<ProposalResponseDto>(`/api/proposals/${proposalId}`);
  return toProposal(data);
}

/** POST /api/proposals — Backend는 항상 DRAFT로 생성한다(팀원에게 노출하려면 publishProposal 별도 호출 필요) */
export async function createProposal(
  teamId: string,
  title: string,
  content: string,
  deadline: string,
  targetCultures: string[] = [],
  cultureAnalysisIds: string[] = [],
): Promise<Proposal> {
  const { data } = await httpClient.post<ProposalResponseDto>("/api/proposals", {
    teamId: Number(teamId),
    title,
    content,
    deadline,
    targetCultures,
    cultureAnalysisIds: cultureAnalysisIds.map(Number),
  });
  return toProposal(data);
}

/**
 * PUT /api/proposals/{proposalId} — DRAFT 상태에서만 허용(그 외 409).
 * targetCultures는 매번 전체 목록을 보내야 한다 — Backend가 PUT을 완전 교체로 처리해서
 * 필드를 생략하면(undefined) 기존에 등록된 문화권이 전부 삭제된다.
 */
export async function updateProposal(
  proposalId: string,
  title: string,
  content: string,
  deadline: string,
  targetCultures: string[] = [],
): Promise<Proposal> {
  const { data } = await httpClient.put<ProposalResponseDto>(`/api/proposals/${proposalId}`, {
    title,
    content,
    deadline,
    targetCultures,
  });
  return toProposal(data);
}

/** DELETE /api/proposals/{proposalId} — DRAFT 상태에서만 허용(그 외 409) */
export async function deleteProposal(proposalId: string): Promise<void> {
  await httpClient.delete(`/api/proposals/${proposalId}`);
}

/** POST /api/proposals/{proposalId}/publish — DRAFT만 허용, 성공 시 OPEN으로 전환된 Proposal을 반환 */
export async function publishProposal(proposalId: string): Promise<Proposal> {
  const { data } = await httpClient.post<ProposalResponseDto>(`/api/proposals/${proposalId}/publish`);
  return toProposal(data);
}

/** POST /api/proposals/{proposalId}/complete — CONSENSUS_READY만 허용(그 외 409), decidedBy는 인증된 호출자로 고정 */
export async function completeProposal(proposalId: string, decision: string): Promise<Proposal> {
  const { data } = await httpClient.post<ProposalResponseDto>(`/api/proposals/${proposalId}/complete`, { decision });
  return toProposal(data);
}

// --- Notifications --------------------------------------------------------

interface NotificationResponseDto {
  id: number;
  proposalId: number | null;
  type: Notification["type"];
  title: string | null;
  content: string | null;
  isRead: boolean;
  createdAt: string;
}

function toNotification(dto: NotificationResponseDto): Notification {
  return {
    id: String(dto.id),
    user_id: "",
    proposal_id: dto.proposalId !== null ? String(dto.proposalId) : null,
    type: dto.type,
    message: dto.title && dto.content ? `${dto.title} — ${dto.content}` : dto.title ?? dto.content ?? "",
    is_read: dto.isRead,
    created_at: dto.createdAt,
  };
}

/** GET /api/notifications — Backend가 인증된 사용자 기준으로 알아서 필터링하므로 userId 파라미터가 없다 */
export async function getNotifications(): Promise<Notification[]> {
  const { data } = await httpClient.get<NotificationResponseDto[]>("/api/notifications");
  return data.map(toNotification);
}

/** PATCH /api/notifications/{notificationId} */
export async function markNotificationRead(notificationId: string): Promise<void> {
  await httpClient.patch(`/api/notifications/${notificationId}`);
}
