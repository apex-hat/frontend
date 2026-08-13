import type { AuthUser, Notification, Opinion, Proposal, Team } from "../types";
import {
  AVATAR_COLORS,
  CURRENT_USER_ID,
  MOCK_NOTIFICATIONS,
  MOCK_OPINIONS,
  MOCK_PROPOSALS,
  MOCK_TEAM,
  MOCK_TEAM_MEMBERS,
  MOCK_USERS,
} from "../features/dashboard/data/mockData";

// mock/실서버 전환은 이 플래그 하나로. 컴포넌트는 아래 함수들만 호출하고
// fetch/mock 분기는 절대 컴포넌트 안에 넣지 않는다.
const USE_MOCK = true;

const MOCK_DELAY_MS = 400;
const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));

function toAuthUser(u: (typeof MOCK_USERS)[number]): AuthUser {
  return { id: u.id, name: u.name, email: u.email, country: u.country, timezone: u.timezone, culture_tag: u.culture_tag };
}

// --- Auth -------------------------------------------------------------

export async function login(email: string, _password: string): Promise<AuthUser> {
  if (USE_MOCK) {
    const user = MOCK_USERS.find((u) => u.email === email) ?? MOCK_USERS.find((u) => u.id === CURRENT_USER_ID)!;
    return delay(toAuthUser(user));
  }
  return fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: _password }),
  }).then((r) => r.json());
}

export async function signup(
  name: string,
  email: string,
  _password: string,
  country: string,
  timezone: string
): Promise<AuthUser> {
  if (USE_MOCK) {
    return delay({ id: `u-${Date.now()}`, name, email, country, timezone, culture_tag: "high-context" });
  }
  return fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password: _password, country, timezone }),
  }).then((r) => r.json());
}

export async function logout(): Promise<void> {
  if (USE_MOCK) return delay(undefined);
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<AuthUser> {
  if (USE_MOCK) return delay(toAuthUser(MOCK_USERS.find((u) => u.id === CURRENT_USER_ID)!));
  return fetch("/api/users/me").then((r) => r.json());
}

// --- Teams --------------------------------------------------------------

export async function getTeams(): Promise<Team[]> {
  if (USE_MOCK) return delay([MOCK_TEAM]);
  return fetch("/api/teams").then((r) => r.json());
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
  return fetch(`/api/dashboard/timezones?teamId=${teamId}`).then((r) => r.json());
}

export interface ProposalStatusResult {
  proposal: Proposal;
  opinions: Opinion[];
}

/** GET /api/dashboard/status — 제안별 Opinions 배열 기반 응답 현황 */
export async function getProposalStatus(proposalId: string): Promise<ProposalStatusResult | null> {
  if (USE_MOCK) {
    const proposal = MOCK_PROPOSALS.find((p) => p.id === proposalId);
    if (!proposal) return delay(null);
    const opinions = MOCK_OPINIONS.filter((o) => o.proposal_id === proposalId);
    return delay({ proposal, opinions });
  }
  return fetch(`/api/dashboard/status?proposalId=${proposalId}`).then((r) => r.json());
}

export async function getProposals(teamId: string = MOCK_TEAM.id): Promise<Proposal[]> {
  if (USE_MOCK) return delay(MOCK_PROPOSALS.filter((p) => p.target_team_id === teamId));
  return fetch(`/api/proposals?teamId=${teamId}`).then((r) => r.json());
}

// --- Notifications --------------------------------------------------------

export async function getNotifications(userId: string = CURRENT_USER_ID): Promise<Notification[]> {
  if (USE_MOCK) {
    // 동일 알림 중복 방지(방어적): 같은 id는 한 번만
    const seen = new Set<string>();
    const deduped = MOCK_NOTIFICATIONS.filter((n) => n.user_id === userId).filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
    return delay(deduped);
  }
  return fetch("/api/notifications").then((r) => r.json());
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (USE_MOCK) return delay(undefined);
  await fetch(`/api/notifications/${notificationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_read: true }),
  });
}
