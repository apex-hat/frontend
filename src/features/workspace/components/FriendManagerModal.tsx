import { useState, type FormEvent } from "react";
import {
  addContact,
  loadContacts,
  type WorkspaceContact,
} from "../workspaceStorage";
import { addTeamMember, searchUserByEmail, type UserSummary } from "../../../lib/api";

interface FriendManagerModalProps {
  open: boolean;
  onClose: () => void;
  /** "팀원 추가" 탭에서 팀원을 추가할 대상 팀. 아직 팀이 준비되지 않았으면 null. */
  teamId: string | null;
}

const INCOMING_REQUEST = {
  id: "u-nora",
  name: "Nora Kim",
  handle: "#MER-NORA",
  avatarColor: "#F2A65A",
  online: true,
} satisfies WorkspaceContact;

export default function FriendManagerModal({ open, onClose, teamId }: FriendManagerModalProps) {
  const [mode, setMode] = useState<"friend" | "team">("friend");
  const [contacts, setContacts] = useState(loadContacts);
  const [friendHandle, setFriendHandle] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [teamEmail, setTeamEmail] = useState("");
  const [foundTeammate, setFoundTeammate] = useState<UserSummary | null>(null);
  const [isSearchingTeammate, setIsSearchingTeammate] = useState(false);
  const [isAddingTeammate, setIsAddingTeammate] = useState(false);

  if (!open) return null;

  const incomingAccepted = contacts.some((contact) => contact.handle === INCOMING_REQUEST.handle);

  const sendFriendRequest = (event: FormEvent) => {
    event.preventDefault();
    const handle = friendHandle.trim().toUpperCase().match(/#MER-[A-Z0-9]{4,}/)?.[0];
    if (!handle) {
      setStatus("#MER-XXXX 형식으로 입력해주세요.");
      return;
    }
    if (contacts.some((contact) => contact.handle === handle)) {
      setStatus("이미 친구로 등록된 사용자입니다.");
      return;
    }
    setStatus(`${handle}님에게 친구 요청을 보냈습니다.`);
    setFriendHandle("");
  };

  const acceptRequest = () => {
    setContacts(addContact(INCOMING_REQUEST));
    setStatus("Nora Kim님의 친구 요청을 수락했습니다. 개인 채팅이 생성되었습니다.");
  };

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
    if (!foundTeammate || !teamId) return;
    setIsAddingTeammate(true);
    try {
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
            <h2 id="connection-manager-title" className="font-display text-xl text-ink">연결 추가</h2>
            <p className="mt-1 text-[11px] text-ink-faint">친구를 찾거나 팀원을 추가하세요.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="text-lg text-ink-dim transition hover:text-ink">×</button>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-lg bg-surface-2 p-1">
          <button type="button" onClick={() => { setMode("friend"); setStatus(null); }} className={`rounded-md py-2 text-xs transition ${mode === "friend" ? "bg-surface-3 text-ink" : "text-ink-faint hover:text-ink-dim"}`}>친구 추가</button>
          <button type="button" onClick={() => { setMode("team"); setStatus(null); }} className={`rounded-md py-2 text-xs transition ${mode === "team" ? "bg-surface-3 text-ink" : "text-ink-faint hover:text-ink-dim"}`}>팀원 추가</button>
        </div>

        {mode === "friend" ? (
          <>
            <form onSubmit={sendFriendRequest}>
              <label htmlFor="friend-manager-handle" className="mb-1.5 block text-xs text-ink-dim">친구 고유 ID</label>
              <div className="flex gap-2">
                <input id="friend-manager-handle" value={friendHandle} onChange={(event) => setFriendHandle(event.target.value)} placeholder="#MER-XXXX" className="min-w-0 flex-1 rounded-lg border border-surface-3 bg-surface-2 px-3.5 py-2.5 font-mono text-xs uppercase text-ink outline-none focus:border-night" />
                <button type="submit" className="rounded-lg bg-ink px-4 text-xs font-semibold text-void">요청</button>
              </div>
            </form>

            <div className="my-5 border-t border-surface-3" />
            <p className="mb-3 text-xs font-semibold text-ink">받은 요청</p>
            <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold text-void" style={{ backgroundColor: INCOMING_REQUEST.avatarColor }}>N</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{INCOMING_REQUEST.name}</p>
                <p className="font-mono text-[9px] text-ink-faint">{INCOMING_REQUEST.handle}</p>
              </div>
              {incomingAccepted ? <span className="text-[11px] text-consensus">수락됨</span> : <button type="button" onClick={acceptRequest} className="rounded-md border border-surface-3 px-3 py-1.5 text-xs text-ink-dim hover:text-ink">수락</button>}
            </div>
          </>
        ) : (
          <>
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
            <p className="mt-2 text-[10px] text-ink-faint">실제 가입된 이메일로 검색해 현재 선택된 팀에 추가합니다.</p>

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
                  disabled={isAddingTeammate || !teamId}
                  className="rounded-md border border-surface-3 px-3 py-1.5 text-xs text-ink-dim hover:text-ink disabled:opacity-50"
                >
                  {isAddingTeammate ? "추가 중" : "추가"}
                </button>
              </div>
            )}
          </>
        )}

        {status && <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-ink-dim">{status}</p>}
      </section>
    </div>
  );
}
