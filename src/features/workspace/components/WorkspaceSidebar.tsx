import { useEffect, useState, type FormEvent } from "react";
import type { AuthUser } from "../../../types";
import {
  GROUPS_CHANGED_EVENT,
  addContact,
  createGroup,
  getInviteUrl,
  getUserHandle,
  loadContacts,
  loadGroups,
  loadMessages,
  saveMessages,
  type ChatMessage,
  type WorkspaceContact,
  type WorkspaceGroup,
} from "../workspaceStorage";

interface WorkspaceSidebarProps {
  user: AuthUser;
}

const INITIAL_REQUEST = {
  id: "u-nora",
  name: "Nora Kim",
  handle: "#MER-NORA",
  avatarColor: "#F2A65A",
  online: true,
} satisfies WorkspaceContact;

export default function WorkspaceSidebar({ user }: WorkspaceSidebarProps) {
  const [groups, setGroups] = useState(loadGroups);
  const [contacts, setContacts] = useState(loadContacts);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [createdGroup, setCreatedGroup] = useState<WorkspaceGroup | null>(null);
  const [copied, setCopied] = useState(false);
  const [friendHandle, setFriendHandle] = useState("");
  const [friendStatus, setFriendStatus] = useState<string | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<WorkspaceContact | null>(() =>
    loadContacts().some((contact) => contact.handle === INITIAL_REQUEST.handle) ? null : INITIAL_REQUEST,
  );
  const [activeContact, setActiveContact] = useState<WorkspaceContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    const syncGroups = () => setGroups(loadGroups());
    window.addEventListener(GROUPS_CHANGED_EVENT, syncGroups);
    return () => window.removeEventListener(GROUPS_CHANGED_EVENT, syncGroups);
  }, []);

  const openGroupModal = () => {
    setGroupName("");
    setCreatedGroup(null);
    setCopied(false);
    setIsGroupModalOpen(true);
  };

  const handleGroupCreate = (event: FormEvent) => {
    event.preventDefault();
    const name = groupName.trim();
    if (!name) return;
    const group = createGroup(name);
    setGroups(loadGroups());
    setCreatedGroup(group);
  };

  const copyInviteLink = async () => {
    if (!createdGroup) return;
    try {
      await navigator.clipboard.writeText(getInviteUrl(createdGroup));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const sendFriendRequest = (event: FormEvent) => {
    event.preventDefault();
    const handle = friendHandle.trim().toUpperCase();
    if (!/^#MER-[A-Z0-9]{4,}$/.test(handle)) {
      setFriendStatus("#MER-XXXX 형식으로 입력해주세요.");
      return;
    }
    if (contacts.some((contact) => contact.handle === handle)) {
      setFriendStatus("이미 친구로 등록된 사용자입니다.");
      return;
    }
    setFriendStatus(`${handle}님에게 친구 요청을 보냈습니다.`);
    setFriendHandle("");
  };

  const acceptFriendRequest = () => {
    if (!incomingRequest) return;
    setContacts(addContact(incomingRequest));
    setIncomingRequest(null);
  };

  const openChat = (contact: WorkspaceContact) => {
    const saved = loadMessages(contact.id);
    setActiveContact(contact);
    setMessages(saved.length > 0 ? saved : [{
      id: `welcome-${contact.id}`,
      sender: "contact",
      text: `${user.name}님, 안녕하세요. 여기서 편하게 이야기해요.`,
      createdAt: new Date().toISOString(),
    }]);
    setMessageText("");
  };

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !activeContact) return;
    const next = [...messages, {
      id: crypto.randomUUID(),
      sender: "me" as const,
      text,
      createdAt: new Date().toISOString(),
    }];
    setMessages(next);
    saveMessages(activeContact.id, next);
    setMessageText("");
  };

  return (
    <>
      <aside className="rounded-2xl border border-surface-3 bg-surface p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-ink">그룹</h2>
            <button
              type="button"
              onClick={openGroupModal}
              className="rounded-full border border-surface-3 px-2.5 py-1 text-[10px] text-ink-dim transition hover:bg-surface-2 hover:text-ink"
            >
              + 만들기
            </button>
          </div>
          <div className="space-y-1">
            {groups.map((group) => (
              <div key={group.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-surface-2">
                <span className="min-w-0 truncate text-xs text-ink-dim">{group.name}</span>
                <span className="shrink-0 font-mono text-[9px] text-ink-faint">{group.memberCount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-surface-3 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-ink">메시지</h2>
            <span className="font-mono text-[9px] text-ink-faint">{getUserHandle(user)}</span>
          </div>
          <div className="space-y-1">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => openChat(contact)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-surface-2"
              >
                <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-void" style={{ backgroundColor: contact.avatarColor }}>
                  {contact.name.slice(0, 1)}
                  {contact.online && <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-surface bg-consensus" />}
                </span>
                <span className="min-w-0 truncate text-xs text-ink-dim">{contact.name}</span>
              </button>
            ))}
          </div>

          <form onSubmit={sendFriendRequest} className="mt-3 space-y-2">
            <label htmlFor="friend-handle" className="block text-[10px] text-ink-faint">고유 ID로 친구 추가</label>
            <div className="flex gap-1.5">
              <input
                id="friend-handle"
                value={friendHandle}
                onChange={(event) => setFriendHandle(event.target.value)}
                placeholder="#MER-XXXX"
                className="min-w-0 flex-1 rounded-lg border border-surface-3 bg-surface-2 px-2.5 py-2 font-mono text-[10px] uppercase text-ink outline-none focus:border-night"
              />
              <button type="submit" className="rounded-lg border border-surface-3 px-2.5 text-[10px] text-ink-dim hover:text-ink">요청</button>
            </div>
            {friendStatus && <p className="text-[10px] leading-snug text-ink-faint">{friendStatus}</p>}
          </form>

          {incomingRequest && (
            <div className="mt-3 rounded-xl border border-night/25 bg-night/10 p-3">
              <p className="text-[10px] text-ink-faint">받은 친구 요청</p>
              <p className="mt-1 text-xs text-ink">{incomingRequest.name}</p>
              <p className="font-mono text-[9px] text-ink-faint">{incomingRequest.handle}</p>
              <button type="button" onClick={acceptFriendRequest} className="mt-2 w-full rounded-lg bg-ink py-1.5 text-[10px] font-semibold text-void">수락</button>
            </div>
          )}
        </div>
      </aside>

      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="group-modal-title" className="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-6 shadow-panel">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="group-modal-title" className="font-display text-xl text-ink">그룹 만들기</h2>
              <button type="button" onClick={() => setIsGroupModalOpen(false)} aria-label="닫기" className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-ink-dim hover:bg-surface-2 hover:text-ink">×</button>
            </div>

            {!createdGroup ? (
              <form onSubmit={handleGroupCreate} className="space-y-4">
                <div>
                  <label htmlFor="group-name" className="mb-1.5 block text-xs text-ink-dim">그룹 이름</label>
                  <input
                    id="group-name"
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    placeholder="예: 신규 서비스 개발 그룹"
                    autoFocus
                    className="w-full rounded-lg border border-surface-3 bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-night"
                  />
                </div>
                <button type="submit" className="w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-void">그룹 생성</button>
              </form>
            ) : (
              <div>
                <p className="text-sm text-ink"><strong>{createdGroup.name}</strong>이 생성되었습니다.</p>
                <p className="mt-1 text-xs text-ink-faint">아래 링크를 공유해 그룹원을 초대하세요.</p>
                <div className="mt-4 flex gap-2">
                  <input readOnly value={getInviteUrl(createdGroup)} className="min-w-0 flex-1 rounded-lg border border-surface-3 bg-surface-2 px-3 py-2 font-mono text-[10px] text-ink-dim" />
                  <button type="button" onClick={copyInviteLink} className="shrink-0 rounded-lg border border-surface-3 px-3 text-xs text-ink-dim hover:text-ink">{copied ? "복사됨" : "복사"}</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {activeContact && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/45 p-5 backdrop-blur-sm sm:items-center sm:justify-center" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="chat-title" className="flex h-[min(620px,85vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-surface-3 bg-void shadow-panel">
            <header className="flex items-center justify-between border-b border-surface-3 bg-surface px-4 py-3">
              <div>
                <h2 id="chat-title" className="text-sm text-ink">{activeContact.name}</h2>
                <p className="font-mono text-[9px] text-ink-faint">{activeContact.handle}</p>
              </div>
              <button type="button" onClick={() => setActiveContact(null)} aria-label="채팅 닫기" className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-ink-dim hover:bg-surface-2 hover:text-ink">×</button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                  <p className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${message.sender === "me" ? "bg-night text-ink" : "border border-surface-3 bg-surface text-ink-dim"}`}>{message.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-surface-3 bg-surface p-3">
              <input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="메시지를 입력하세요" className="min-w-0 flex-1 rounded-lg border border-surface-3 bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-night" />
              <button type="submit" className="rounded-lg bg-ink px-4 text-xs font-semibold text-void">전송</button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
