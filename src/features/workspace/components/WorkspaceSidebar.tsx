import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AuthUser, Team } from "../../../types";
import {
  getConversation,
  getTeamMembers,
  getTeamMessages,
  sendMessage,
  sendTeamMessage,
  type FriendSummary,
  type MessageSummary,
  type TeamMemberProfile,
  type TeamMessageSummary,
} from "../../../lib/api";
import { useTeamEvents } from "../../../lib/teamEvents";

interface WorkspaceSidebarProps {
  user: AuthUser;
  teams: Team[];
  selectedTeamId: string | null;
  isLoadingTeams: boolean;
  onSelectTeam: (teamId: string | null) => void;
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

  const [isTeamChatOpen, setIsTeamChatOpen] = useState(false);
  const teamMessageListRef = useRef<HTMLDivElement>(null);
  const [teamMessages, setTeamMessages] = useState<TeamMessageSummary[]>([]);
  const [teamMessageText, setTeamMessageText] = useState("");
  const [isLoadingTeamMessages, setIsLoadingTeamMessages] = useState(false);
  const [isSendingTeamMessage, setIsSendingTeamMessage] = useState(false);
  const [teamMessageError, setTeamMessageError] = useState<string | null>(null);

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

  // 팀을 전환하거나 친구 채팅을 열면 팀 채팅 패널은 닫는다(둘이 동시에 열려있을 이유가 없다).
  const [prevSelectedTeamId, setPrevSelectedTeamId] = useState(selectedTeamId);
  if (selectedTeamId !== prevSelectedTeamId) {
    setPrevSelectedTeamId(selectedTeamId);
    setIsTeamChatOpen(false);
  }
  const [prevChatFriend, setPrevChatFriend] = useState(chatFriend);
  if (chatFriend !== prevChatFriend) {
    setPrevChatFriend(chatFriend);
    if (chatFriend) setIsTeamChatOpen(false);
  }

  // 팀 채팅이 열려있는 동안에는 메시지가 오면 폴링(3초)을 기다리지 않고 바로 다시 조회한다.
  const [teamChatRefreshTick, setTeamChatRefreshTick] = useState(0);
  useTeamEvents(isTeamChatOpen ? selectedTeamId : null, () => setTeamChatRefreshTick((tick) => tick + 1));

  useEffect(() => {
    if (!isTeamChatOpen || !selectedTeamId) return;
    let cancelled = false;
    const load = (showSpinner: boolean) => {
      if (showSpinner) setIsLoadingTeamMessages(true);
      getTeamMessages(selectedTeamId)
        .then((list) => { if (!cancelled) { setTeamMessages(list); setTeamMessageError(null); } })
        .catch(() => { if (!cancelled) setTeamMessageError("대화를 불러오지 못했습니다."); })
        .finally(() => { if (!cancelled && showSpinner) setIsLoadingTeamMessages(false); });
    };
    load(true);
    const interval = window.setInterval(() => load(false), 3000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [isTeamChatOpen, selectedTeamId, teamChatRefreshTick]);

  useEffect(() => {
    teamMessageListRef.current?.scrollTo({ top: teamMessageListRef.current.scrollHeight });
  }, [teamMessages]);

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

  const submitTeamMessage = async (event: FormEvent) => {
    event.preventDefault();
    const content = teamMessageText.trim();
    if (!selectedTeamId || !content) return;
    setIsSendingTeamMessage(true);
    setTeamMessageError(null);
    try {
      const sent = await sendTeamMessage(selectedTeamId, content);
      setTeamMessages((current) => [...current, sent]);
      setTeamMessageText("");
    } catch {
      setTeamMessageError("메시지를 보내지 못했습니다. 팀 소속인지 확인해주세요.");
    } finally {
      setIsSendingTeamMessage(false);
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

  if (isTeamChatOpen && selectedTeamId) {
    return (
      <aside className="flex h-[calc(100vh-65px)] min-h-0 flex-col py-3">
        <div className="flex items-center gap-2 border-b border-surface-3 pb-3">
          <button type="button" onClick={() => setIsTeamChatOpen(false)} aria-label="채팅 닫기" className="flex h-7 w-7 items-center justify-center text-ink-dim hover:text-ink">←</button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink">{selectedTeam?.name}</p>
            <p className="truncate text-[9px] text-ink-faint">팀 채팅</p>
          </div>
        </div>
        <div ref={teamMessageListRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto py-3">
          {isLoadingTeamMessages && <p className="text-center text-[10px] text-ink-faint">대화를 불러오는 중...</p>}
          {!isLoadingTeamMessages && teamMessages.length === 0 && <p className="px-2 py-6 text-center text-[10px] leading-5 text-ink-faint">아직 메시지가 없어요.<br />먼저 인사해보세요.</p>}
          {teamMessages.map((message) => {
            const mine = message.senderId === user.id;
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-xl px-2.5 py-2 text-[11px] leading-5 ${mine ? "rounded-br-sm bg-night text-ink" : "rounded-bl-sm bg-surface-2 text-ink-dim"}`}>
                  {!mine && <p className="mb-0.5 text-[9px] font-medium text-ink-faint">{message.senderName}</p>}
                  {message.content}
                </div>
              </div>
            );
          })}
        </div>
        {teamMessageError && <p className="mb-2 text-[9px] text-alert">{teamMessageError}</p>}
        <form onSubmit={submitTeamMessage} className="flex gap-1.5 border-t border-surface-3 pt-3">
          <input value={teamMessageText} onChange={(event) => setTeamMessageText(event.target.value)} placeholder="메시지 입력" className="min-w-0 flex-1 rounded-full border border-surface-3 bg-surface-2 px-3 py-2 text-[11px] text-ink outline-none focus:border-night" />
          <button type="submit" disabled={!teamMessageText.trim() || isSendingTeamMessage} className="h-8 shrink-0 rounded-full bg-ink px-3 text-[10px] font-semibold text-void disabled:opacity-40">전송</button>
        </form>
      </aside>
    );
  }

  return (
    <aside className="lg:sticky lg:top-[65px] lg:max-h-[calc(100vh-65px)] lg:overflow-y-auto">
      <div ref={teamMenuRef}>
        <div className="flex h-8 items-center gap-1.5">
          <button
            type="button"
            onClick={() => (teams.length > 0 || selectedTeamId !== null) && setIsTeamMenuOpen((open) => !open)}
            aria-expanded={isTeamMenuOpen}
            className="flex h-8 min-w-0 flex-1 items-center justify-between gap-2 text-left"
          >
            <span className="min-w-0 truncate text-xs font-semibold text-ink">
              {isLoadingTeams ? "불러오는 중..." : selectedTeam?.name ?? "전체 팀"}
            </span>
            {(teams.length > 1 || selectedTeamId !== null) && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 text-ink-faint transition-transform ${isTeamMenuOpen ? "rotate-180" : ""}`}>
                <path d="m7 10 5 5 5-5" />
              </svg>
            )}
          </button>
          {selectedTeamId && (
            <button type="button" onClick={() => setIsTeamChatOpen(true)} aria-label="팀 채팅 열기" title="팀 채팅"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-faint transition hover:bg-surface-2 hover:text-ink">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </button>
          )}
        </div>

        {isTeamMenuOpen && (
          <div className="mb-2 overflow-hidden rounded-xl border border-surface-3 bg-surface-2 py-1 shadow-panel">
            {selectedTeamId && (
              <button
                type="button"
                onClick={() => { onSelectTeam(null); setIsTeamMenuOpen(false); }}
                className="w-full truncate px-3 py-2 text-left text-xs text-ink-dim transition hover:text-ink"
              >
                전체 팀 보기
              </button>
            )}
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
        {!selectedTeamId && <p className="py-4 text-center text-[10px] text-ink-faint">팀을 선택하면 팀원 목록이 표시됩니다.</p>}
        {selectedTeamId && isLoadingMembers && <p className="py-4 text-center text-[10px] text-ink-faint">불러오는 중...</p>}
        {selectedTeamId && !isLoadingMembers && members.length === 0 && (
          <p className="py-4 text-center text-[10px] text-ink-faint">아직 팀원이 없습니다.</p>
        )}
        {selectedTeamId && members.map((member) => (
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
