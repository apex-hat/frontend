import { useState, type FormEvent } from "react";
import { addTeamMember, getOrCreateDefaultTeamId, searchUserByEmail, type UserSummary } from "../../../lib/api";

interface FriendManagerModalProps {
  open: boolean;
  onClose: () => void;
}

export default function FriendManagerModal({ open, onClose }: FriendManagerModalProps) {
  const [teamEmail, setTeamEmail] = useState("");
  const [foundTeammate, setFoundTeammate] = useState<UserSummary | null>(null);
  const [isSearchingTeammate, setIsSearchingTeammate] = useState(false);
  const [isAddingTeammate, setIsAddingTeammate] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  if (!open) return null;

  const searchTeammate = async (event: FormEvent) => {
    event.preventDefault();
    const email = teamEmail.trim();
    if (!email) return;

    setIsSearchingTeammate(true);
    setFoundTeammate(null);
    setStatus(null);
    try {
      const user = await searchUserByEmail(email);
      if (!user) {
        setStatus("해당 이메일로 가입한 사용자를 찾지 못했습니다.");
        return;
      }
      setFoundTeammate(user);
    } catch {
      setStatus("검색에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSearchingTeammate(false);
    }
  };

  const addTeammate = async () => {
    if (!foundTeammate) return;
    setIsAddingTeammate(true);
    try {
      const teamId = await getOrCreateDefaultTeamId();
      await addTeamMember(teamId, foundTeammate.id, "MEMBER");
      setStatus(`${foundTeammate.name}님을 팀에 추가했습니다.`);
      setFoundTeammate(null);
      setTeamEmail("");
    } catch {
      setStatus("팀원 추가에 실패했습니다. 이미 팀에 속해 있거나 권한이 없을 수 있습니다.");
    } finally {
      setIsAddingTeammate(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="connection-manager-title" className="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-6 shadow-panel">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 id="connection-manager-title" className="font-display text-xl text-ink">팀원 추가</h2>
            <p className="mt-1 text-[11px] text-ink-faint">이메일로 검색해 현재 팀에 추가하세요.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="text-lg text-ink-dim transition hover:text-ink">×</button>
        </div>

        <form onSubmit={searchTeammate}>
          <label htmlFor="team-invite-email" className="mb-1.5 block text-xs text-ink-dim">팀원 이메일</label>
          <div className="flex gap-2">
            <input
              id="team-invite-email"
              type="email"
              value={teamEmail}
              onChange={(event) => { setTeamEmail(event.target.value); setFoundTeammate(null); }}
              placeholder="teammate@example.com"
              className="min-w-0 flex-1 rounded-lg border border-surface-3 bg-surface-2 px-3.5 py-2.5 text-xs text-ink outline-none focus:border-night"
            />
            <button type="submit" disabled={isSearchingTeammate} className="rounded-lg bg-ink px-4 text-xs font-semibold text-void disabled:opacity-50">
              {isSearchingTeammate ? "검색 중" : "검색"}
            </button>
          </div>
        </form>

        {foundTeammate && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface-2 p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night text-[10px] font-semibold text-void">
              {foundTeammate.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">{foundTeammate.name}</p>
              <p className="text-[10px] text-ink-faint">{foundTeammate.email}</p>
            </div>
            <button
              type="button"
              onClick={addTeammate}
              disabled={isAddingTeammate}
              className="rounded-md border border-surface-3 px-3 py-1.5 text-xs text-ink-dim hover:text-ink disabled:opacity-50"
            >
              {isAddingTeammate ? "추가 중" : "추가"}
            </button>
          </div>
        )}

        {status && <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-ink-dim">{status}</p>}
      </section>
    </div>
  );
}
