import { useEffect, useState, type FormEvent } from "react";
import type { AuthUser } from "../../../types";
import {
  CONTACTS_CHANGED_EVENT,
  GROUPS_CHANGED_EVENT,
  createGroup,
  getInviteUrl,
  leaveGroup,
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
  mode: "messages" | "groups";
}

const MEMBER_PROFILES = [
  { name: "이민아", color: "#63C7A6" },
  { name: "Alex Turner", color: "#7C8FE0" },
  { name: "Sofia Almeida", color: "#E8607A" },
  { name: "Omar Haddad", color: "#63C7A6" },
  { name: "佐藤 陽翔", color: "#7C8FE0" },
  { name: "Priya Nair", color: "#E8607A" },
  { name: "Jack Wilson", color: "#F2A65A" },
  { name: "Lena Schmidt", color: "#F2A65A" },
  { name: "Noah Williams", color: "#7C8FE0" },
];

export default function WorkspaceSidebar({ user, mode }: WorkspaceSidebarProps) {
  const [groups, setGroups] = useState(loadGroups);
  const [contacts, setContacts] = useState(loadContacts);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [createdGroup, setCreatedGroup] = useState<WorkspaceGroup | null>(null);
  const [copied, setCopied] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ group: WorkspaceGroup; x: number; y: number } | null>(null);
  const [memberGroup, setMemberGroup] = useState<WorkspaceGroup | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<WorkspaceGroup | null>(null);
  const [groupActionStatus, setGroupActionStatus] = useState<string | null>(null);
  const [activeContact, setActiveContact] = useState<WorkspaceContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    const syncGroups = () => setGroups(loadGroups());
    const syncContacts = () => setContacts(loadContacts());
    const closeContextMenu = () => setContextMenu(null);
    window.addEventListener(GROUPS_CHANGED_EVENT, syncGroups);
    window.addEventListener(CONTACTS_CHANGED_EVENT, syncContacts);
    window.addEventListener("click", closeContextMenu);
    return () => {
      window.removeEventListener(GROUPS_CHANGED_EVENT, syncGroups);
      window.removeEventListener(CONTACTS_CHANGED_EVENT, syncContacts);
      window.removeEventListener("click", closeContextMenu);
    };
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

  const copyGroupLink = async (group: WorkspaceGroup) => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(group));
      setGroupActionStatus(`${group.name} 초대 링크를 복사했습니다.`);
    } catch {
      setGroupActionStatus("링크를 복사하지 못했습니다.");
    }
    setContextMenu(null);
  };

  const confirmLeaveGroup = () => {
    if (!leaveTarget) return;
    setGroups(leaveGroup(leaveTarget.id));
    setGroupActionStatus(`${leaveTarget.name}에서 나갔습니다.`);
    setLeaveTarget(null);
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
      <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        {mode === "groups" && <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-ink">그룹 관리</h2>
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
              <div
                key={group.id}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setContextMenu({ group, x: event.clientX, y: event.clientY });
                }}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-surface-2"
                title="우클릭하여 그룹 관리"
              >
                <span className="min-w-0 truncate text-xs text-ink-dim">{group.name}</span>
                <span className="shrink-0 font-mono text-[9px] text-ink-faint">{group.memberCount}</span>
              </div>
            ))}
          </div>
          {groupActionStatus && <p className="mt-2 text-[10px] leading-snug text-ink-faint">{groupActionStatus}</p>}
        </div>}

        {mode === "messages" && <div>
          <h2 className="mb-3 text-xs font-semibold text-ink">메시지 관리</h2>
          <p className="mb-1.5 px-2 text-[10px] text-ink-faint">그룹 채팅</p>
          <div className="mb-4 space-y-1">
            {groups.slice(0, 4).map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => openChat({
                  id: `group-${group.id}`,
                  name: group.name,
                  handle: `${group.memberCount}명`,
                  avatarColor: "#7C8FE0",
                  online: false,
                })}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-surface-2"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-night/15 text-[11px] font-semibold text-night">#</span>
                <span className="min-w-0 truncate text-xs text-ink-dim">{group.name}</span>
              </button>
            ))}
          </div>

          <p className="mb-1.5 border-t border-surface-3 px-2 pt-4 text-[10px] text-ink-faint">개인 메시지</p>
          <div className="space-y-1">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => openChat(contact)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-surface-2"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-void" style={{ backgroundColor: contact.avatarColor }}>
                  {contact.name.slice(0, 1)}
                </span>
                <span className="min-w-0 truncate text-xs text-ink-dim">{contact.name}</span>
              </button>
            ))}
          </div>
        </div>}
      </aside>

      {contextMenu && (
        <div
          className="fixed z-50 w-44 overflow-hidden rounded-xl border border-surface-3 bg-surface-2 py-1 shadow-panel"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 190), top: Math.min(contextMenu.y, window.innerHeight - 150) }}
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" onClick={() => { setMemberGroup(contextMenu.group); setContextMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-ink-dim hover:bg-surface-3 hover:text-ink">멤버 보기</button>
          <button type="button" onClick={() => void copyGroupLink(contextMenu.group)} className="w-full px-3 py-2 text-left text-xs text-ink-dim hover:bg-surface-3 hover:text-ink">그룹 링크 복사</button>
          <div className="my-1 border-t border-surface-3" />
          <button type="button" onClick={() => { setLeaveTarget(contextMenu.group); setContextMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-alert hover:bg-alert/10">그룹 나가기</button>
        </div>
      )}

      {memberGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="member-list-title" className="w-full max-w-sm rounded-2xl border border-surface-3 bg-surface p-6 shadow-panel">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 id="member-list-title" className="font-display text-lg text-ink">{memberGroup.name}</h2>
                <p className="mt-0.5 text-xs text-ink-faint">멤버 {memberGroup.memberCount}명</p>
              </div>
              <button type="button" onClick={() => setMemberGroup(null)} aria-label="닫기" className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-ink-dim hover:bg-surface-2 hover:text-ink">×</button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-day text-[10px] font-semibold text-void">{user.name.slice(0, 1)}</span>
                <span className="text-sm text-ink">{user.name}</span>
              </div>
              {MEMBER_PROFILES.slice(0, Math.max(0, memberGroup.memberCount - 1)).map((member) => (
                <div key={member.name} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold text-void" style={{ backgroundColor: member.color }}>{member.name.slice(0, 1)}</span>
                  <span className="text-sm text-ink">{member.name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {leaveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="leave-group-title" className="w-full max-w-sm rounded-2xl border border-surface-3 bg-surface p-6 text-center shadow-panel">
            <h2 id="leave-group-title" className="font-display text-lg text-ink">{leaveTarget.name}에서 나갈까요?</h2>
            <p className="mt-2 text-sm text-ink-dim">나간 뒤에는 이 그룹의 제안과 대화를 볼 수 없습니다.</p>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={() => setLeaveTarget(null)} className="flex-1 rounded-lg border border-surface-3 py-2.5 text-sm text-ink-dim hover:text-ink">취소</button>
              <button type="button" onClick={confirmLeaveGroup} className="flex-1 rounded-lg bg-alert py-2.5 text-sm font-semibold text-void">나가기</button>
            </div>
          </section>
        </div>
      )}

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
        <div className="fixed inset-0 z-50 flex items-stretch justify-start bg-black/35 p-3 backdrop-blur-sm sm:p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="chat-title" className="flex h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border border-surface-3 bg-void shadow-panel">
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
