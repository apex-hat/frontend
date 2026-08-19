import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { isAxiosError } from "axios";
import type { AuthUser, Notification, Opinion, Proposal, ProposalStatus, Stance, Team, TeamRole } from "../types";
import {
  AVATAR_COLORS,
  CURRENT_USER_ID,
  MOCK_NOTIFICATIONS,
  MOCK_TEAM,
  MOCK_TEAM_MEMBERS,
  MOCK_USERS,
} from "../features/dashboard/data/mockData";
import { auth } from "./firebase";
import { httpClient } from "./httpClient";

// mock/실서버 전환은 이 플래그 하나로. 컴포넌트는 아래 함수들만 호출하고
// fetch/mock 분기는 절대 컴포넌트 안에 넣지 않는다.
const USE_MOCK = true;

const MOCK_DELAY_MS = 120;
const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));

/** fetch는 401/500 같은 HTTP 에러도 reject하지 않으므로, 응답을 쓰기 전에 res.ok를 직접 확인한다. */
async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// --- Auth -------------------------------------------------------------

/** Firebase Auth로 로그인한 뒤, JIT 동기화된 Backend 프로필을 조회해 반환한다. */
export async function login(email: string, password: string): Promise<AuthUser> {
  await signInWithEmailAndPassword(auth, email, password);
  return getMe();
}

/**
 * Firebase Auth로 계정을 만들고 JIT 동기화된 Backend 프로필을 조회해 반환한다.
 * country/timezone/preferredLanguage는 여기서 받지 않는다 — Backend는 이 값을 저장할
 * 방법이 없다(`/api/auth/signup`은 501, `/api/users/me`는 PATCH 미제공, JIT 동기화는
 * Firebase ID Token의 custom claim만 읽는데 클라이언트 SDK로는 custom claim을 설정할
 * 수 없음). 계약 변경 없이는 반영 불가능하므로 실제로 전달되는 값은 이름뿐이다.
 */
export async function signup(name: string, email: string, password: string): Promise<AuthUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  // updateProfile은 이미 발급된 ID Token의 name claim을 갱신하지 않으므로, 강제로 새 토큰을 받아온다.
  await credential.user.getIdToken(true);
  return getMe();
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

/** GET /api/dashboard/timezones — 팀원 목록 + 현지 시간 계산용 timezone + 근무 여부는 클라이언트에서 파생 */
export async function getTimezones(teamId: string = MOCK_TEAM.id): Promise<TimezoneEntry[]> {
  if (USE_MOCK) {
    const entries = MOCK_TEAM_MEMBERS.filter((tm) => tm.team_id === teamId)
      .map((tm) => {
        const user = MOCK_USERS.find((u) => u.id === tm.user_id);
        // 위치 정보(country/timezone)가 없으면 대시보드에서 조용히 필터링
        if (!user || !user.country || !user.timezone) return null;
        return {
          user_id: user.id,
          name: user.name,
          country: user.country,
          timezone: user.timezone || "Asia/Seoul",
          culture_tag: user.culture_tag,
          role: tm.role,
          avatarColor: AVATAR_COLORS[user.id] ?? "#7C8FE0",
        };
      })
      .filter((e): e is TimezoneEntry => e !== null);
    return delay(entries);
  }
  return fetch(`/api/dashboard/timezones?teamId=${teamId}`).then((r) => parseJson<TimezoneEntry[]>(r));
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
): Promise<Proposal> {
  const { data } = await httpClient.post<ProposalResponseDto>("/api/proposals", {
    teamId: Number(teamId),
    title,
    content,
    deadline,
    targetCultures,
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

/**
 * 제안 생성엔 실제 teamId가 필요한데 팀 생성/선택 UI가 없다(앱 전체가 단일 암시적 팀
 * 가정). GET /api/teams를 먼저 확인해 있으면 그 팀을, 없으면 그때만 1회 기본 팀을
 * 만들어 쓴다 — 매번 서버 상태를 먼저 확인하므로 새로고침해도 중복 생성되지 않는다.
 */
export async function getOrCreateDefaultTeamId(): Promise<string> {
  const teams = await getTeams();
  if (teams.length > 0) return teams[0].id;
  const created = await createTeam("Meridian Team", "", "");
  return created.id;
}

// --- Notifications --------------------------------------------------------

const MOCK_READ_NOTIFICATIONS_KEY = "meridian.mock-read-notifications";

function getMockReadNotificationIds() {
  try {
    return new Set<string>(JSON.parse(window.sessionStorage.getItem(MOCK_READ_NOTIFICATIONS_KEY) ?? "[]") as string[]);
  } catch {
    return new Set<string>();
  }
}

export async function getNotifications(userId: string = CURRENT_USER_ID): Promise<Notification[]> {
  if (USE_MOCK) {
    // 동일 알림 중복 방지(방어적): 같은 id는 한 번만
    const seen = new Set<string>();
    const deduped = MOCK_NOTIFICATIONS.filter((n) => n.user_id === userId).filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
    const readIds = getMockReadNotificationIds();
    return delay(deduped.map((notification) => readIds.has(notification.id) ? { ...notification, is_read: true } : notification));
  }
  return fetch("/api/notifications").then((r) => parseJson<Notification[]>(r));
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (USE_MOCK) {
    const readIds = getMockReadNotificationIds();
    readIds.add(notificationId);
    window.sessionStorage.setItem(MOCK_READ_NOTIFICATIONS_KEY, JSON.stringify([...readIds]));
    return delay(undefined);
  }
  const res = await fetch(`/api/notifications/${notificationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_read: true }),
  });
  if (!res.ok) throw new Error(`API request failed: ${res.status} ${res.statusText}`);
}
