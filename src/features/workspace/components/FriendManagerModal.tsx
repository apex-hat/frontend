import { useState, type FormEvent } from "react";
import {
  addContact,
  loadContacts,
  type WorkspaceContact,
} from "../workspaceStorage";

interface FriendManagerModalProps {
  open: boolean;
  onClose: () => void;
}

const INCOMING_REQUEST = {
  id: "u-nora",
  name: "Nora Kim",
  handle: "#MER-NORA",
  avatarColor: "#F2A65A",
  online: true,
} satisfies WorkspaceContact;

export default function FriendManagerModal({ open, onClose }: FriendManagerModalProps) {
  const [contacts, setContacts] = useState(loadContacts);
  const [friendHandle, setFriendHandle] = useState("");
  const [status, setStatus] = useState<string | null>(null);

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
    setStatus("Nora Kim님의 친구 요청을 수락했습니다.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="friend-manager-title" className="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-6 shadow-panel">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="friend-manager-title" className="font-display text-xl text-ink">친구 관리</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-ink-dim hover:bg-surface-2 hover:text-ink">×</button>
        </div>

        <form onSubmit={sendFriendRequest}>
          <label htmlFor="friend-manager-handle" className="mb-1.5 block text-xs text-ink-dim">고유 ID로 친구 추가</label>
          <div className="flex gap-2">
            <input
              id="friend-manager-handle"
              value={friendHandle}
              onChange={(event) => setFriendHandle(event.target.value)}
              placeholder="#MER-XXXX"
              className="min-w-0 flex-1 rounded-lg border border-surface-3 bg-surface-2 px-3.5 py-2.5 font-mono text-xs uppercase text-ink outline-none focus:border-night"
            />
            <button type="submit" className="rounded-lg bg-ink px-4 text-xs font-semibold text-void">요청</button>
          </div>
        </form>

        <div className="my-5 border-t border-surface-3" />

        <div>
          <p className="mb-3 text-xs font-semibold text-ink">받은 요청</p>
          <div className="flex items-center gap-3 rounded-xl border border-surface-3 bg-surface-2 p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold text-void" style={{ backgroundColor: INCOMING_REQUEST.avatarColor }}>N</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">{INCOMING_REQUEST.name}</p>
              <p className="font-mono text-[9px] text-ink-faint">{INCOMING_REQUEST.handle}</p>
            </div>
            {incomingAccepted ? (
              <span className="text-[11px] text-consensus">수락됨</span>
            ) : (
              <button type="button" onClick={acceptRequest} className="rounded-lg border border-surface-3 px-3 py-1.5 text-xs text-ink-dim hover:text-ink">수락</button>
            )}
          </div>
        </div>

        {status && <p className="mt-4 text-xs text-ink-dim">{status}</p>}
      </section>
    </div>
  );
}
