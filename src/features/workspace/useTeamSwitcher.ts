import { useCallback, useEffect, useState } from "react";
import { createTeam, getTeams, updateTeamName } from "../../lib/api";
import type { AuthUser, Team } from "../../types";

const SELECTED_TEAM_KEY = "meridian.selected-team-id";

function loadSelectedTeamId(): string | null {
  try {
    return window.localStorage.getItem(SELECTED_TEAM_KEY);
  } catch {
    return null;
  }
}

function saveSelectedTeamId(teamId: string) {
  window.localStorage.setItem(SELECTED_TEAM_KEY, teamId);
}

/**
 * 로그인한 사용자가 속한 팀(그룹) 목록과 "현재 보고 있는 팀"을 관리한다.
 * 팀이 하나도 없으면(첫 로그인) "{이름}의 팀"을 자동 생성해 기본 팀으로 삼는다.
 * 선택된 팀은 localStorage에 저장해 새로고침/다른 화면 이동 후에도 유지된다.
 */
export function useTeamSwitcher(user: AuthUser) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getTeams()
      .then(async (list) => {
        if (list.length === 0) {
          const created = await createTeam(`${user.name}의 팀`, user.country, user.culture_tag);
          list = [created];
        }
        if (cancelled) return;
        setTeams(list);
        const stored = loadSelectedTeamId();
        const nextSelected = stored && list.some((team) => team.id === stored) ? stored : list[0].id;
        setSelectedTeamId(nextSelected);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const selectTeam = useCallback((teamId: string) => {
    setSelectedTeamId(teamId);
    saveSelectedTeamId(teamId);
  }, []);

  const createGroup = useCallback(async (name: string) => {
    const created = await createTeam(name, user.country, user.culture_tag);
    setTeams((current) => [...current, created]);
    selectTeam(created.id);
    return created;
  }, [selectTeam, user.country, user.culture_tag]);

  const renameTeam = useCallback(async (teamId: string, name: string) => {
    const updated = await updateTeamName(teamId, name);
    setTeams((current) => current.map((team) => (team.id === teamId ? updated : team)));
    return updated;
  }, []);

  return { teams, selectedTeamId, isLoading, selectTeam, createGroup, renameTeam };
}
