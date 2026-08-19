import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AuthUser, Team } from "../../../types";
import { getTeamMembers, type TeamMemberProfile } from "../../../lib/api";

interface WorkspaceSidebarProps {
  user: AuthUser;
  teams: Team[];
  selectedTeamId: string | null;
  isLoadingTeams: boolean;
  onSelectTeam: (teamId: string) => void;
  onCreateGroup: (name: string) => Promise<Team>;
}

const AVATAR_PALETTE = ["#F2A65A", "#63C7A6", "#7C8FE0", "#E8607A"];

function colorForUser(userId: string) {
  let hash = 0;
  for (const character of userId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export default function WorkspaceSidebar({ user, teams, selectedTeamId, isLoadingTeams, onSelectTeam, onCreateGroup }: WorkspaceSidebarProps) {
  const [members, setMembers] = useState<TeamMemberProfile[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const teamMenuRef = useRef<HTMLDivElement>(null);

  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? null;

  useEffect(() => {
    if (!selectedTeamId) return;
    let cancelled = false;
    getTeamMembers(selectedTeamId)
      .then((list) => {
        if (!cancelled) setMembers(list);
      })
      .catch(() => { /* 팀원 조회 실패 시 조용히 빈 상태로 둔다 */ })
      .finally(() => {
        if (!cancelled) setIsLoadingMembers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTeamId]);

  useEffect(() => {
    const closeTeamMenu = (event: MouseEvent) => {
      if (teamMenuRef.current && !teamMenuRef.current.contains(event.target as Node)) setIsTeamMenuOpen(false);
    };
    document.addEventListener("mousedown", closeTeamMenu);
    return () => document.removeEventListener("mousedown", closeTeamMenu);
  }, []);

  const openCreateModal = () => {
    setGroupName("");
    setCreateError(null);
    setIsCreateOpen(true);
    setIsTeamMenuOpen(false);
  };

  const handleCreateGroup = async (event: FormEvent) => {
    event.preventDefault();
    const name = groupName.trim();
    if (!name) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      await onCreateGroup(name);
      setIsCreateOpen(false);
    } catch {
      setCreateError("그룹 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <aside className="lg:sticky lg:top-[65px] lg:max-h-[calc(100vh-65px)] lg:overflow-y-auto">
      <div ref={teamMenuRef}>
        <button
          type="button"
          onClick={() => teams.length > 0 && setIsTeamMenuOpen((open) => !open)}
          aria-expanded={isTeamMenuOpen}
          className="flex h-8 w-full items-center justify-between gap-2 text-left"
        >
          <span className="min-w-0 truncate text-xs font-semibold text-ink">
            {isLoadingTeams ? "불러오는 중..." : selectedTeam?.name ?? "팀 없음"}
          </span>
          {teams.length > 1 && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 text-ink-faint transition-transform ${isTeamMenuOpen ? "rotate-180" : ""}`}>
              <path d="m7 10 5 5 5-5" />
            </svg>
          )}
        </button>

        {isTeamMenuOpen && (
          <div className="mb-2 overflow-hidden rounded-xl border border-surface-3 bg-surface-2 py-1 shadow-panel">
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => { onSelectTeam(team.id); setIsTeamMenuOpen(false); }}
                className={`w-full truncate px-3 py-2 text-left text-xs transition ${team.id === selectedTeamId ? "text-ink" : "text-ink-dim hover:text-ink"}`}
              >
                {team.name}
              </button>
            ))}
            <div className="my-1 border-t border-surface-3" />
            <button type="button" onClick={openCreateModal} className="w-full px-3 py-2 text-left text-xs text-ink-dim transition hover:text-ink">
              + 새 그룹 만들기
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 flex h-6 items-center justify-between gap-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">팀원</h2>
        <span className="text-[10px] text-ink-faint">{members.length}명</span>
      </div>
      <div className="border-t border-surface-3">
        {isLoadingMembers && <p className="py-4 text-center text-[10px] text-ink-faint">불러오는 중...</p>}
        {!isLoadingMembers && members.length === 0 && (
          <p className="py-4 text-center text-[10px] text-ink-faint">아직 팀원이 없습니다.</p>
        )}
        {members.map((member) => (
          <div key={member.user_id} className="flex items-center gap-2.5 border-b border-surface-3 px-1 py-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-void"
              style={{ backgroundColor: colorForUser(member.user_id) }}
            >
              {member.name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink">
                  {member.name}
                  {member.user_id === user.id && <span className="ml-1 text-[9px] text-ink-faint">(나)</span>}
                </p>
                {member.role === "PM" && (
                  <span className="shrink-0 rounded-full bg-surface-2 px-1.5 py-0.5 text-[8px] text-ink-faint">PM</span>
                )}
              </div>
              <p className="mt-0.5 truncate text-[9px] text-ink-faint">{member.email}</p>
            </div>
          </div>
        ))}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="create-group-title" className="w-full max-w-sm rounded-2xl border border-surface-3 bg-surface p-6 shadow-panel">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="create-group-title" className="font-display text-lg text-ink">새 그룹 만들기</h2>
              <button type="button" onClick={() => setIsCreateOpen(false)} aria-label="닫기" className="text-lg text-ink-dim hover:text-ink">×</button>
            </div>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label htmlFor="new-group-name" className="mb-1.5 block text-xs text-ink-dim">그룹 이름</label>
                <input
                  id="new-group-name"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="예: 신규 서비스 개발 그룹"
                  autoFocus
                  className="w-full rounded-lg border border-surface-3 bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-night"
                />
              </div>
              {createError && <p className="text-xs text-alert">{createError}</p>}
              <button type="submit" disabled={isCreating || !groupName.trim()} className="w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-void disabled:opacity-50">
                {isCreating ? "생성 중..." : "그룹 생성"}
              </button>
            </form>
          </section>
        </div>
      )}
    </aside>
  );
}
