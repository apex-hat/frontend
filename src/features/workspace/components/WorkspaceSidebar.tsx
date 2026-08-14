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
  loadUnreadChatIds,
  saveMessages,
  saveUnreadChatIds,
  type ChatMessage,
  type WorkspaceContact,
  type WorkspaceGroup,
} from "../workspaceStorage";

interface WorkspaceSidebarProps {
  user: AuthUser;
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

function GroupAvatar({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-lg border border-surface-3 bg-surface-2 text-ink-dim ${compact ? "h-7 w-7" : "h-8 w-8"}`} aria-hidden="true">
      <svg width={compact ? 13 : 15} height={compact ? 13 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M3.5 18.5c.5-3.2 2.4-5 5.5-5s5 1.8 5.5 5" />
        <path d="M15 14.5c2.8-.5 4.7.8 5.5 3.5" />
      </svg>
    </span>
  );
}

function formatChatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit" }).format(date)
    : `${date.getMonth() + 1}. ${date.getDate()}`;
}

export default function WorkspaceSidebar({ user }: WorkspaceSidebarProps) {
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
  const [unreadChatIds, setUnreadChatIds] = useState(loadUnreadChatIds);

  useEffect(() => {
    const syncGroups = () => setGroups(loadGroups());
    const syncContacts = () => setContacts(loadContacts());
    const closeContextMenu = () => {
      setContextMenu(null);
    };
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
    setGroupActionStatus(null);
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
    if (unreadChatIds.includes(contact.id)) {
      setUnreadChatIds((current) => {
        const next = current.filter((id) => id !== contact.id);
        saveUnreadChatIds(next);
        return next;
      });
    }
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

  const groupChats: WorkspaceContact[] = groups.map((group) => ({
    id: `group-${group.id}`,
    name: group.name,
    handle: `${group.memberCount}명`,
    avatarColor: "#7C8FE0",
    online: false,
  }));
  const chatList = [...groupChats, ...contacts]
    .map((contact) => {
      const conversationMessages = loadMessages(contact.id);
      return { contact, latestMessage: conversationMessages.at(-1) };
    })
    .sort((a, b) => new Date(b.latestMessage?.createdAt ?? 0).getTime() - new Date(a.latestMessage?.createdAt ?? 0).getTime());

  return (
    <>
      <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        {activeContact ? (
            <div className="flex h-[calc(100vh-8.5rem)] min-h-[420px] flex-col">
              <div className="flex items-center gap-2 border-b border-surface-3 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveContact(null)}
                  aria-label="대화 목록으로 돌아가기"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <h2 className="truncate text-xs font-semibold text-ink">{activeContact.name}</h2>
                  {activeContact.id.startsWith("group-") && <p className="mt-0.5 text-[10px] text-ink-faint">{activeContact.handle}</p>}
                </div>
              </div>

              <div className="flex-1 space-y-2.5 overflow-y-auto py-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                    <p className={`max-w-[88%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${message.sender === "me" ? "rounded-br-md bg-night text-ink" : "rounded-bl-md bg-surface-2 text-ink-dim"}`}>
                      {message.text}
                    </p>
                  </div>
                ))}
              </div>

              <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-surface-3 pt-3">
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="메시지 입력"
                  className="min-w-0 flex-1 rounded-full border border-surface-3 bg-surface-2 px-3 py-2 text-[11px] text-ink outline-none transition focus:border-ink-faint"
                />
                <button type="submit" aria-label="메시지 전송" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-void transition hover:opacity-85">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 12 14-7-4 14-3-6-7-1Z" />
                  </svg>
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold text-ink">메시지</h2>
                <button
                  type="button"
                  onClick={openGroupModal}
                  aria-label="그룹 만들기"
                  title="그룹 만들기"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
              <div className="mt-3 border-t border-surface-3">
                {chatList.map(({ contact, latestMessage }) => (
                  <div
                    key={contact.id}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      if (!contact.id.startsWith("group-")) return;
                      const group = groups.find((item) => `group-${item.id}` === contact.id);
                      if (group) setContextMenu({ group, x: event.clientX, y: event.clientY });
                    }}
                    className="flex items-center gap-2.5 border-b border-surface-3 px-1 py-2.5 transition hover:bg-surface-2/60"
                  >
                    <button type="button" onClick={() => openChat(contact)} aria-label={`${contact.name} 대화 열기`} className="shrink-0">
                      {contact.id.startsWith("group-") ? (
                        <GroupAvatar />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold text-void" style={{ backgroundColor: contact.avatarColor }}>
                          {contact.name.slice(0, 1)}
                        </span>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => openChat(contact)} className="min-w-0 flex-1 truncate text-left text-[11px] font-medium text-ink">
                          {contact.name}
                        </button>
                        <span className="shrink-0 text-[9px] text-ink-faint">{formatChatTime(latestMessage?.createdAt)}</span>
                      </div>
                      <button type="button" onClick={() => openChat(contact)} className="mt-1 flex w-full items-center gap-2 text-left">
                        <span className="min-w-0 flex-1 truncate text-[9px] text-ink-faint">
                          {latestMessage ? `${latestMessage.sender === "me" ? "나: " : ""}${latestMessage.text}` : "대화를 시작해보세요"}
                        </span>
                        {unreadChatIds.includes(contact.id) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-night" aria-label="읽지 않은 메시지" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {groupActionStatus && <p className="mt-2 text-[10px] leading-snug text-ink-faint">{groupActionStatus}</p>}
            </div>
          )
        }
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
          <button type="button" onClick={() => { setLeaveTarget(contextMenu.group); setContextMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-alert hover:bg-alert/10">채팅방 나가기</button>
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

    </>
  );
}
