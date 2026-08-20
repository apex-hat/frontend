import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AuthUser, Team } from "../../../types";
import { getConversation, getTeamMembers, sendMessage, type FriendSummary, type MessageSummary, type TeamMemberProfile } from "../../../lib/api";

interface WorkspaceSidebarProps {
  user: AuthUser;
  teams: Team[];
  selectedTeamId: string | null;
  isLoadingTeams: boolean;
  onSelectTeam: (teamId: string) => void;
  onCreateGroup: (name: string) => Promise<Team>;
  chatFriend?: FriendSummary | null;
  onCloseChat?: () => void;
  onOpenTeamManager?: () => void;
}

const AVATAR_PALETTE = ["#F2A65A", "#63C7A6", "#7C8FE0", "#E8607A"];

function colorForUser(userId: string) {
  let hash = 0;
  for (const character of userId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export default function WorkspaceSidebar({ user, teams, selectedTeamId, isLoadingTeams, onSelectTeam, onCreateGroup, chatFriend = null, onCloseChat, onOpenTeamManager }: WorkspaceSidebarProps) {
  const [members, setMembers] = useState<TeamMemberProfile[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const teamMenuRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!chatFriend) return;
    let cancelled = false;
    const load = (showSpinner: boolean) => {
      if (showSpinner) setIsLoadingMessages(true);
      getConversation(chatFriend.userId)
        .then((list) => { if (!cancelled) { setMessages(list); setMessageError(null); } })
        .catch(() => { if (!cancelled) setMessageError("대화를 불러오지 못했습니다."); })
        .finally(() => { if (!cancelled && showSpinner) setIsLoadingMessages(false); });
    };
    load(true);
    const interval = window.setInterval(() => load(false), 3000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [chatFriend]);

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight });
  }, [messages]);

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

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    const content = messageText.trim();
    if (!chatFriend || !content) return;
    setIsSendingMessage(true);
    setMessageError(null);
    try {
      const sent = await sendMessage(chatFriend.userId, content);
      setMessages((current) => [...current, sent]);
      setMessageText("");
    } catch {
      setMessageError("메시지를 보내지 못했습니다. 친구 관계인지 확인해주세요.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (chatFriend) {
    return (
      <aside className="flex h-[calc(100vh-65px)] min-h-0 flex-col py-3">
        <div className="flex items-center gap-2 border-b border-surface-3 pb-3">
          <button type="button" onClick={onCloseChat} aria-label="채팅 닫기" className="flex h-7 w-7 items-center justify-center text-ink-dim hover:text-ink">←</button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink">{chatFriend.name}</p>
            <p className="truncate text-[9px] text-ink-faint">{chatFriend.friendCode ? `#${chatFriend.friendCode.replace(/^#/, "")}` : "1:1 메시지"}</p>
          </div>
        </div>
        <div ref={messageListRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto py-3">
          {isLoadingMessages && <p className="text-center text-[10px] text-ink-faint">대화를 불러오는 중...</p>}
          {!isLoadingMessages && messages.length === 0 && <p className="px-2 py-6 text-center text-[10px] leading-5 text-ink-faint">아직 메시지가 없어요.<br />먼저 인사해보세요.</p>}
          {messages.map((message) => {
            const mine = message.senderId === user.id;
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-xl px-2.5 py-2 text-[11px] leading-5 ${mine ? "rounded-br-sm bg-night text-ink" : "rounded-bl-sm bg-surface-2 text-ink-dim"}`}>{message.content}</div>
              </div>
            );
          })}
        </div>
        {messageError && <p className="mb-2 text-[9px] text-alert">{messageError}</p>}
        <form onSubmit={submitMessage} className="flex gap-1.5 border-t border-surface-3 pt-3">
          <input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="메시지 입력" className="min-w-0 flex-1 rounded-full border border-surface-3 bg-surface-2 px-3 py-2 text-[11px] text-ink outline-none focus:border-night" />
          <button type="submit" disabled={!messageText.trim() || isSendingMessage} className="h-8 shrink-0 rounded-full bg-ink px-3 text-[10px] font-semibold text-void disabled:opacity-40">전송</button>
        </form>
      </aside>
    );
  }

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
            {teams.filter((team) => team.id !== selectedTeamId).map((team) => (
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
            {selectedTeam && onOpenTeamManager && (
              <button type="button" onClick={() => { onOpenTeamManager(); setIsTeamMenuOpen(false); }} className="w-full px-3 py-2 text-left text-xs text-ink-dim transition hover:text-ink">
                팀 관리
              </button>
            )}
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
