import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  searchUserByFriendCode,
  sendFriendRequest,
  getIncomingFriendRequests,
  respondToFriendRequest,
  getFriends,
  sendMessage,
  getConversation,
  sendTeamInvite,
  getIncomingTeamInvites,
  respondToTeamInvite,
  FriendRequestError,
  TeamInviteError,
  type FriendRequestSummary,
  type FriendSummary,
  type MessageSummary,
  type TeamInviteSummary,
  type UserSummary,
} from "../../../lib/api";

interface FriendManagerModalProps {
  open: boolean;
  onClose: () => void;
  /** 메시지 말풍선을 좌/우로 나눌 기준이 되는 현재 로그인 사용자 id. */
  currentUserId: string;
  /** "팀원 초대" 탭에서 초대를 보낼 대상 팀. 아직 팀이 준비되지 않았으면 null. */
  teamId: string | null;
  /** 친구의 메시지 버튼을 눌렀을 때 보드 좌측 채팅을 여는 콜백. */
  onOpenChat?: (friend: FriendSummary) => void;
  /** 알림(FRIEND_REQUEST/TEAM_INVITE) 클릭처럼, 열릴 때 특정 탭을 보여줘야 할 때 지정. */
  initialMode?: "friend" | "team";
}

const CHAT_POLL_INTERVAL_MS = 3000;

function formatMessageTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export default function FriendManagerModal({ open, onClose, currentUserId, teamId, onOpenChat: onOpenSidebarChat, initialMode }: FriendManagerModalProps) {
  const [mode, setMode] = useState<"friend" | "team">("friend");
  const [friendHandle, setFriendHandle] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestSummary[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [teamFriendCode, setTeamFriendCode] = useState("");
  const [matchedTeammateCode, setMatchedTeammateCode] = useState("");
  const [foundTeammate, setFoundTeammate] = useState<UserSummary | null>(null);
  const [isSearchingTeammate, setIsSearchingTeammate] = useState(false);
  const [isInvitingTeammate, setIsInvitingTeammate] = useState(false);
  const [incomingTeamInvites, setIncomingTeamInvites] = useState<TeamInviteSummary[]>([]);
  const [isLoadingTeamInvites, setIsLoadingTeamInvites] = useState(true);
  const [respondingTeamInviteId, setRespondingTeamInviteId] = useState<string | null>(null);

  const [activeChatFriend, setActiveChatFriend] = useState<FriendSummary | null>(null);
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && initialMode) setMode(initialMode);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getIncomingFriendRequests()
      .then((list) => {
        if (!cancelled) setIncomingRequests(list);
      })
      .catch(() => { /* 조회 실패 시 빈 목록으로 둔다 */ })
      .finally(() => {
        if (!cancelled) setIsLoadingRequests(false);
      });
    getFriends()
      .then((list) => {
        if (!cancelled) setFriends(list);
      })
      .catch(() => { /* 조회 실패 시 빈 목록으로 둔다 */ })
      .finally(() => {
        if (!cancelled) setIsLoadingFriends(false);
      });
    getIncomingTeamInvites()
      .then((list) => {
        if (!cancelled) setIncomingTeamInvites(list);
      })
      .catch(() => { /* 조회 실패 시 빈 목록으로 둔다 */ })
      .finally(() => {
        if (!cancelled) setIsLoadingTeamInvites(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // 대화창이 열려있는 동안 짧은 주기로 다시 조회해 실시간처럼 보이게 한다(WebSocket 없이 폴링).
  useEffect(() => {
    if (!activeChatFriend) return;
    let cancelled = false;

    const load = (showSpinner: boolean) => {
      if (showSpinner) setIsLoadingMessages(true);
      getConversation(activeChatFriend.userId)
        .then((list) => {
          if (!cancelled) setMessages(list);
        })
        .catch(() => { /* 폴링 실패는 조용히 무시하고 다음 주기에 재시도 */ })
        .finally(() => {
          if (!cancelled && showSpinner) setIsLoadingMessages(false);
        });
    };

    load(true);
    const interval = window.setInterval(() => load(false), CHAT_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeChatFriend]);

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight });
  }, [messages]);

  if (!open) return null;

  const submitFriendRequest = async (event: FormEvent) => {
    event.preventDefault();
    const handle = friendHandle.trim().toUpperCase().match(/#?MER-[A-Z0-9]{4,}/)?.[0];
    if (!handle) {
      setStatus("#MER-XXXX 형식으로 입력해주세요.");
      return;
    }
    setIsSendingRequest(true);
    setStatus(null);
    try {
      await sendFriendRequest(handle);
      setStatus(`${handle}님에게 친구 요청을 보냈습니다.`);
      setFriendHandle("");
    } catch (error) {
      if (error instanceof FriendRequestError) {
        setStatus(
          error.code === "USER_NOT_FOUND" ? "해당 고유 ID의 사용자를 찾을 수 없습니다."
            : error.code === "SELF_FRIEND_REQUEST" ? "자기 자신에게는 요청을 보낼 수 없습니다."
              : error.code === "FRIEND_REQUEST_EXISTS" ? "이미 친구이거나 요청이 진행 중입니다."
                : "친구 요청에 실패했습니다.",
        );
      } else {
        setStatus("친구 요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setIsSendingRequest(false);
    }
  };

  const respond = async (requestId: string, accept: boolean, requesterName: string) => {
    setRespondingId(requestId);
    try {
      const resolved = await respondToFriendRequest(requestId, accept);
      setIncomingRequests((current) => current.filter((request) => request.id !== requestId));
      if (accept) {
        setFriends((current) => [
          ...current,
          {
            userId: resolved.requesterId === currentUserId ? resolved.addresseeId : resolved.requesterId,
            name: requesterName,
            email: "",
            friendCode: "",
          },
        ]);
      }
      setStatus(accept ? `${requesterName}님의 친구 요청을 수락했습니다.` : `${requesterName}님의 친구 요청을 거절했습니다.`);
    } catch {
      setStatus("요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setRespondingId(null);
    }
  };

  const openChat = (friend: FriendSummary) => {
    if (onOpenSidebarChat) {
      onOpenSidebarChat(friend);
      onClose();
      return;
    }
    setMessages([]);
    setActiveChatFriend(friend);
  };

  const closeChat = () => {
    setActiveChatFriend(null);
    setMessages([]);
    setMessageText("");
  };

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !activeChatFriend) return;
    setIsSendingMessage(true);
    try {
      const sent = await sendMessage(activeChatFriend.userId, text);
      setMessages((current) => [...current, sent]);
      setMessageText("");
    } catch {
      setStatus("메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const searchTeammate = async (event: FormEvent) => {
    event.preventDefault();
    const handle = teamFriendCode.trim().toUpperCase().match(/#?MER-[A-Z0-9]{4,}/)?.[0];
    if (!handle) {
      setStatus("#MER-XXXX 형식으로 입력해주세요.");
      return;
    }

    setIsSearchingTeammate(true);
    setFoundTeammate(null);
    setStatus(null);
    try {
      const user = await searchUserByFriendCode(handle);
      if (!user) {
        setStatus("해당 고유 ID로 가입한 사용자를 찾지 못했습니다.");
        return;
      }
      setFoundTeammate(user);
      setMatchedTeammateCode(handle);
    } catch {
      setStatus("검색에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSearchingTeammate(false);
    }
  };

  const inviteTeammate = async () => {
    if (!foundTeammate || !teamId) return;
    setIsInvitingTeammate(true);
    try {
      await sendTeamInvite(teamId, matchedTeammateCode);
      setStatus(`${foundTeammate.name}님에게 팀 초대를 보냈습니다. 상대가 수락하면 팀원이 됩니다.`);
      setFoundTeammate(null);
      setTeamFriendCode("");
    } catch (error) {
      setStatus(
        error instanceof TeamInviteError
          ? error.code === "TEAM_MEMBER_ALREADY_EXISTS" ? "이미 이 팀에 속한 사용자입니다."
            : error.code === "TEAM_INVITE_EXISTS" ? "이미 초대를 보낸 사용자입니다."
              : error.code === "TEAM_PM_REQUIRED" ? "팀 PM만 초대를 보낼 수 있습니다."
                : "팀 초대에 실패했습니다."
          : "팀 초대에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setIsInvitingTeammate(false);
    }
  };

  const respondTeamInvite = async (inviteId: string, accept: boolean, teamName: string) => {
    setRespondingTeamInviteId(inviteId);
    try {
      await respondToTeamInvite(inviteId, accept);
      setIncomingTeamInvites((current) => current.filter((invite) => invite.id !== inviteId));
      setStatus(accept ? `'${teamName}' 팀 초대를 수락했습니다.` : `'${teamName}' 팀 초대를 거절했습니다.`);
    } catch {
      setStatus("초대 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setRespondingTeamInviteId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="connection-manager-title" className="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-6 shadow-panel">
        {activeChatFriend ? (
          <div className="flex h-[28rem] flex-col">
            <div className="mb-4 flex items-center gap-2">
              <button type="button" onClick={closeChat} aria-label="목록으로 돌아가기" className="flex h-7 w-7 shrink-0 items-center justify-center text-ink-dim hover:text-ink">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <h2 className="min-w-0 flex-1 truncate font-display text-lg text-ink">{activeChatFriend.name}</h2>
              <button type="button" onClick={onClose} aria-label="닫기" className="text-lg text-ink-dim hover:text-ink">×</button>
            </div>

            <div ref={messageListRef} className="flex-1 space-y-2 overflow-y-auto">
              {isLoadingMessages && <p className="text-center text-xs text-ink-faint">불러오는 중...</p>}
              {!isLoadingMessages && messages.length === 0 && (
                <p className="text-center text-xs text-ink-faint">아직 메시지가 없어요. 먼저 인사해보세요.</p>
              )}
              {messages.map((message) => {
                const isMine = message.senderId === currentUserId;
                return (
                  <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[78%]">
                      <p className={`rounded-lg px-2.5 py-1.5 text-[12px] leading-relaxed ${isMine ? "rounded-br-sm bg-night text-ink" : "rounded-bl-sm bg-surface-2 text-ink-dim"}`}>
                        {message.content}
                      </p>
                      <p className={`mt-0.5 text-[9px] text-ink-faint ${isMine ? "text-right" : ""}`}>{formatMessageTime(message.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={submitMessage} className="mt-3 flex items-center gap-2 border-t border-surface-3 pt-3">
              <input
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="메시지 입력"
                className="min-w-0 flex-1 rounded-full border border-surface-3 bg-surface-2 px-3.5 py-2 text-xs text-ink outline-none focus:border-night"
              />
              <button type="submit" disabled={isSendingMessage || !messageText.trim()} aria-label="메시지 전송" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-void disabled:opacity-50">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12 14-7-4 14-3-6-7-1Z" />
                </svg>
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 id="connection-manager-title" className="font-display text-xl text-ink">연결 추가</h2>
                <p className="mt-1 text-[11px] text-ink-faint">친구를 찾거나 팀원을 초대하세요.</p>
              </div>
              <button type="button" onClick={onClose} aria-label="닫기" className="text-lg text-ink-dim transition hover:text-ink">×</button>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-lg bg-surface-2 p-1">
              <button type="button" onClick={() => { setMode("friend"); setStatus(null); }} className={`rounded-md py-2 text-xs transition ${mode === "friend" ? "bg-surface-3 text-ink" : "text-ink-faint hover:text-ink-dim"}`}>친구 추가</button>
              <button type="button" onClick={() => { setMode("team"); setStatus(null); }} className={`rounded-md py-2 text-xs transition ${mode === "team" ? "bg-surface-3 text-ink" : "text-ink-faint hover:text-ink-dim"}`}>팀원 초대</button>
            </div>

            {mode === "friend" ? (
              <>
                <form onSubmit={submitFriendRequest}>
                  <label htmlFor="friend-manager-handle" className="mb-1.5 block text-xs text-ink-dim">친구 고유 ID</label>
                  <div className="flex gap-2">
                    <input id="friend-manager-handle" value={friendHandle} onChange={(event) => setFriendHandle(event.target.value)} placeholder="#MER-XXXX" className="min-w-0 flex-1 rounded-lg border border-surface-3 bg-surface-2 px-3.5 py-2.5 font-mono text-xs uppercase text-ink outline-none focus:border-night" />
                    <button type="submit" disabled={isSendingRequest} className="rounded-lg bg-ink px-4 text-xs font-semibold text-void disabled:opacity-50">
                      {isSendingRequest ? "전송 중" : "요청"}
                    </button>
                  </div>
                </form>

                <div className="my-5 border-t border-surface-3" />
                <p className="mb-3 text-xs font-semibold text-ink">받은 요청</p>
                {isLoadingRequests && <p className="text-xs text-ink-faint">불러오는 중...</p>}
                {!isLoadingRequests && incomingRequests.length === 0 && (
                  <p className="text-xs text-ink-faint">받은 친구 요청이 없습니다.</p>
                )}
                <div className="space-y-2">
                  {incomingRequests.map((request) => (
                    <div key={request.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night text-[10px] font-semibold text-void">
                        {request.requesterName.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink">{request.requesterName}</p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => respond(request.id, true, request.requesterName)}
                          disabled={respondingId === request.id}
                          className="rounded-md border border-surface-3 px-3 py-1.5 text-xs text-ink-dim hover:text-ink disabled:opacity-50"
                        >
                          수락
                        </button>
                        <button
                          type="button"
                          onClick={() => respond(request.id, false, request.requesterName)}
                          disabled={respondingId === request.id}
                          className="rounded-md border border-surface-3 px-3 py-1.5 text-xs text-ink-faint hover:text-ink disabled:opacity-50"
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="my-5 border-t border-surface-3" />
                <p className="mb-3 text-xs font-semibold text-ink">내 친구 <span className="text-ink-faint">{friends.length}</span></p>
                {isLoadingFriends && <p className="text-xs text-ink-faint">불러오는 중...</p>}
                {!isLoadingFriends && friends.length === 0 && (
                  <p className="text-xs text-ink-faint">아직 친구가 없습니다.</p>
                )}
                <div className="space-y-1">
                  {friends.map((friend) => (
                    <button
                      key={friend.userId}
                      type="button"
                      onClick={() => openChat(friend)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-surface-2"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-day text-[10px] font-semibold text-void">
                        {friend.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{friend.name}</span>
                      <span className="shrink-0 text-[10px] text-ink-faint">메시지</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <form onSubmit={searchTeammate}>
                  <label htmlFor="team-invite-code" className="mb-1.5 block text-xs text-ink-dim">팀원 고유 ID</label>
                  <div className="flex gap-2">
                    <input
                      id="team-invite-code"
                      value={teamFriendCode}
                      onChange={(event) => { setTeamFriendCode(event.target.value); setFoundTeammate(null); }}
                      placeholder="#MER-XXXX"
                      className="min-w-0 flex-1 rounded-lg border border-surface-3 bg-surface-2 px-3.5 py-2.5 font-mono text-xs uppercase text-ink outline-none focus:border-night"
                    />
                    <button type="submit" disabled={isSearchingTeammate} className="rounded-lg bg-ink px-4 text-xs font-semibold text-void disabled:opacity-50">
                      {isSearchingTeammate ? "검색 중" : "검색"}
                    </button>
                  </div>
                </form>
                <p className="mt-2 text-[10px] text-ink-faint">고유 ID로 초대를 보내면, 상대가 수락해야 현재 선택된 팀에 합류합니다.</p>

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
                      onClick={inviteTeammate}
                      disabled={isInvitingTeammate || !teamId}
                      className="rounded-md border border-surface-3 px-3 py-1.5 text-xs text-ink-dim hover:text-ink disabled:opacity-50"
                    >
                      {isInvitingTeammate ? "초대 중" : "초대"}
                    </button>
                  </div>
                )}

                <div className="my-5 border-t border-surface-3" />
                <p className="mb-3 text-xs font-semibold text-ink">받은 팀 초대</p>
                {isLoadingTeamInvites && <p className="text-xs text-ink-faint">불러오는 중...</p>}
                {!isLoadingTeamInvites && incomingTeamInvites.length === 0 && (
                  <p className="text-xs text-ink-faint">받은 팀 초대가 없습니다.</p>
                )}
                <div className="space-y-2">
                  {incomingTeamInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-night text-[10px] font-semibold text-void">
                        {invite.teamName.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{invite.teamName}</p>
                        <p className="truncate text-[10px] text-ink-faint">{invite.invitedByName}님이 초대함</p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => respondTeamInvite(invite.id, true, invite.teamName)}
                          disabled={respondingTeamInviteId === invite.id}
                          className="rounded-md border border-surface-3 px-3 py-1.5 text-xs text-ink-dim hover:text-ink disabled:opacity-50"
                        >
                          수락
                        </button>
                        <button
                          type="button"
                          onClick={() => respondTeamInvite(invite.id, false, invite.teamName)}
                          disabled={respondingTeamInviteId === invite.id}
                          className="rounded-md border border-surface-3 px-3 py-1.5 text-xs text-ink-faint hover:text-ink disabled:opacity-50"
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {status && <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-ink-dim">{status}</p>}
          </>
        )}
      </section>
    </div>
  );
}
