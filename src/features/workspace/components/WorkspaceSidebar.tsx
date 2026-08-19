import { useEffect, useState } from "react";
import type { AuthUser } from "../../../types";
import { getOrCreateDefaultTeamId, getTeamMembers, type TeamMemberProfile } from "../../../lib/api";

interface WorkspaceSidebarProps {
  user: AuthUser;
}

const AVATAR_PALETTE = ["#F2A65A", "#63C7A6", "#7C8FE0", "#E8607A"];

function colorForUser(userId: string) {
  let hash = 0;
  for (const character of userId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export default function WorkspaceSidebar({ user }: WorkspaceSidebarProps) {
  const [members, setMembers] = useState<TeamMemberProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getOrCreateDefaultTeamId()
      .then((teamId) => getTeamMembers(teamId))
      .then((list) => {
        if (!cancelled) setMembers(list);
      })
      .catch(() => { /* 팀이 아직 없으면 조용히 빈 상태로 둔다 */ })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="lg:sticky lg:top-[65px] lg:max-h-[calc(100vh-65px)] lg:overflow-y-auto">
      <div className="flex h-8 items-center justify-between gap-2">
        <h2 className="text-xs font-semibold text-ink">팀원</h2>
        <span className="text-[10px] text-ink-faint">{members.length}명</span>
      </div>
      <div className="border-t border-surface-3">
        {isLoading && <p className="py-4 text-center text-[10px] text-ink-faint">불러오는 중...</p>}
        {!isLoading && members.length === 0 && (
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
    </aside>
  );
}
