import { useEffect, useState, type FormEvent } from "react";
import { addTeamMember, getTeamMembers, removeTeamMember, searchUserByEmail, type TeamMemberProfile, type UserSummary } from "../../../lib/api";
import type { AuthUser, Team } from "../../../types";

interface Props {
  open: boolean;
  onClose: () => void;
  user: AuthUser;
  team: Team | null;
  onMembersChanged?: () => void;
}

export default function TeamManagerModal({ open, onClose, user, team, onMembersChanged }: Props) {
  const [members, setMembers] = useState<TeamMemberProfile[]>([]);
  const [email, setEmail] = useState("");
  const [foundUser, setFoundUser] = useState<UserSummary | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const loadMembers = () => {
    if (!team) return;
    getTeamMembers(team.id).then(setMembers).catch(() => setStatus("팀원 목록을 불러오지 못했습니다."));
  };

  useEffect(() => {
    if (!open || !team) return;
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, team?.id]);

  if (!open || !team) return null;

  const me = members.find((member) => member.user_id === user.id);
  const isPm = me?.role === "PM";

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setIsBusy(true);
    setFoundUser(null);
    setStatus(null);
    try {
      const result = await searchUserByEmail(email.trim());
      if (!result) setStatus("해당 이메일로 가입한 사용자가 없습니다.");
      else if (members.some((member) => member.user_id === result.id)) setStatus("이미 이 팀에 참여한 사용자입니다.");
      else setFoundUser(result);
    } catch {
      setStatus("사용자 검색에 실패했습니다.");
    } finally {
      setIsBusy(false);
    }
  };

  const add = async () => {
    if (!foundUser) return;
    setIsBusy(true);
    try {
      const added = await addTeamMember(team.id, foundUser.id, "MEMBER");
      setMembers((current) => [...current, added]);
      setStatus(`${foundUser.name}님을 팀에 추가했습니다.`);
      setFoundUser(null);
      setEmail("");
      onMembersChanged?.();
    } catch {
      setStatus("추가하지 못했습니다. PM 권한을 확인해주세요.");
    } finally {
      setIsBusy(false);
    }
  };

  const remove = async (member: TeamMemberProfile) => {
    if (!window.confirm(`${member.name}님을 팀에서 내보낼까요?`)) return;
    setIsBusy(true);
    try {
      await removeTeamMember(team.id, member.user_id);
      setMembers((current) => current.filter((item) => item.user_id !== member.user_id));
      setStatus(`${member.name}님을 팀에서 내보냈습니다.`);
      onMembersChanged?.();
    } catch {
      setStatus("팀원을 내보내지 못했습니다.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="team-manager-title" className="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-6 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] text-ink-faint">팀 관리</p>
            <h2 id="team-manager-title" className="mt-1 font-display text-xl text-ink">{team.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="text-lg text-ink-dim hover:text-ink">×</button>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-ink">팀원</p><span className="text-[10px] text-ink-faint">{members.length}명</span></div>
          <div className="max-h-48 divide-y divide-surface-3 overflow-y-auto rounded-xl border border-surface-3 px-3">
            {members.map((member) => (
              <div key={member.user_id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1"><p className="truncate text-xs text-ink">{member.name}{member.user_id === user.id ? " (나)" : ""}</p><p className="truncate text-[9px] text-ink-faint">{member.email}</p></div>
                <span className="text-[9px] text-ink-faint">{member.role}</span>
                {isPm && member.user_id !== user.id && <button type="button" disabled={isBusy} onClick={() => remove(member)} className="text-[10px] text-ink-faint hover:text-alert">내보내기</button>}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 border-t border-surface-3 pt-5">
          <p className="text-xs font-semibold text-ink">팀원 추가</p>
          {isPm ? (
            <>
              <p className="mt-1 text-[10px] leading-4 text-ink-faint">현재는 초대 링크 방식이 아니라, 이미 가입한 사용자의 이메일을 검색해 바로 팀에 추가합니다.</p>
              <form onSubmit={search} className="mt-3 flex gap-2"><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setFoundUser(null); }} placeholder="teammate@example.com" className="min-w-0 flex-1 rounded-lg border border-surface-3 bg-surface-2 px-3 py-2 text-xs text-ink outline-none focus:border-night" /><button disabled={isBusy} className="rounded-lg bg-ink px-4 text-xs font-semibold text-void disabled:opacity-50">검색</button></form>
              {foundUser && <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface-2 p-3"><div className="min-w-0 flex-1"><p className="text-xs text-ink">{foundUser.name}</p><p className="truncate text-[9px] text-ink-faint">{foundUser.email}</p></div><button type="button" onClick={add} disabled={isBusy} className="rounded-md border border-surface-3 px-3 py-1.5 text-xs text-ink-dim hover:text-ink">추가</button></div>}
            </>
          ) : <p className="mt-2 text-[10px] text-ink-faint">PM만 팀원을 추가하거나 내보낼 수 있습니다.</p>}
        </div>
        {status && <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-ink-dim">{status}</p>}
      </section>
    </div>
  );
}
