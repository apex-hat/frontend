import { useEffect, useState } from "react";
import type { AuthUser, Notification, Opinion, Proposal } from "../../../types";
import {
  completeProposal as completeProposalApi,
  deleteProposal as deleteProposalApi,
  getNotifications,
  getOrCreateDefaultTeamId,
  getProposalStatus,
  getProposals,
  getTimezones,
  markNotificationRead,
} from "../../../lib/api";
import type { TimezoneEntry } from "../../../lib/api";
import WorldClockStrip from "./WorldClockStrip";
import NotificationPanel from "./NotificationPanel";
import ProposalStatusBadge from "./ProposalStatusBadge";
import TeamMemberRow from "./TeamMemberRow";
import WorkspaceSidebar from "../../workspace/components/WorkspaceSidebar";
import FriendManagerModal from "../../workspace/components/FriendManagerModal";
import UserHandleButton from "../../workspace/components/UserHandleButton";
import {
  GROUPS_CHANGED_EVENT,
  LAST_OPENED_CHAT_CHANGED_EVENT,
  loadGroups,
  loadLastOpenedChat,
  loadMessages,
  saveMessages,
} from "../../workspace/workspaceStorage";
import { loadSubmittedProposals } from "../../../mocks/proposal";
import BrandMark from "../../../components/branding/BrandMark";
import ConnectionButton from "../../workspace/components/ConnectionButton";
import { MOCK_PROPOSAL_GROUP_NAMES } from "../data/mockData";

const STANCE_ORDER: Record<Opinion["stance"], number> = {
  AGREE: 0,
  CONDITIONAL_AGREE: 1,
  DISAGREE: 2,
};

const COMPLETED_VISIBLE_MS = 48 * 60 * 60 * 1000;

function isComplete(proposal: Proposal) {
  return proposal.status === "COMPLETED";
}

function sortProposals(list: Proposal[]) {
  return [...list].sort((a, b) => {
    const completionDifference = Number(isComplete(a)) - Number(isComplete(b));
    if (completionDifference !== 0) return completionDifference;
    const aTime = new Date(isComplete(a) ? a.completed_at ?? a.deadline : a.created_at).getTime();
    const bTime = new Date(isComplete(b) ? b.completed_at ?? b.deadline : b.created_at).getTime();
    return bTime - aTime;
  });
}

function buildResultSummary(opinions: Opinion[]) {
  const agree = opinions.filter((opinion) => opinion.stance === "AGREE").length;
  const conditional = opinions.filter((opinion) => opinion.stance === "CONDITIONAL_AGREE").length;
  const disagree = opinions.filter((opinion) => opinion.stance === "DISAGREE").length;
  if (opinions.length === 0) return "집계된 의견 없이 대표의 최종 결정으로 협의를 마무리했습니다.";
  const direction = agree >= conditional + disagree
    ? "제안의 방향에 대체로 공감했습니다."
    : "의견이 나뉘어 조건과 우려를 함께 검토했습니다.";
  return `총 ${opinions.length}명의 의견을 집계했습니다. 찬성 ${agree}명, 조건부 ${conditional}명, 반대 ${disagree}명으로 ${direction}`;
}

interface DashboardProps {
  user: AuthUser;
  onLogout: () => void;
  onCreateProposal: () => void;
  onOpenProfile: () => void;
  onOpenProposal: (proposalId: string) => void;
  onEditProposal: (proposalId: string) => void;
  onViewProposal: (proposalId: string) => void;
}

export default function Dashboard({ user, onLogout, onCreateProposal, onOpenProfile, onOpenProposal, onEditProposal, onViewProposal }: DashboardProps) {
  const [members, setMembers] = useState<TimezoneEntry[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [opinionsByProposal, setOpinionsByProposal] = useState<Record<string, Opinion[]>>({});
  const [isFriendManagerOpen, setIsFriendManagerOpen] = useState(false);
  const [lastOpenedChat, setLastOpenedChat] = useState(loadLastOpenedChat);
  const [proposalMenu, setProposalMenu] = useState<{ proposal: Proposal; x: number; y: number } | null>(null);
  const [completionTarget, setCompletionTarget] = useState<Proposal | null>(null);
  const [completionComment, setCompletionComment] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [analysisTarget, setAnalysisTarget] = useState<Proposal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null);
  const [workspaceGroups, setWorkspaceGroups] = useState(loadGroups);
  const [submittedProposals, setSubmittedProposals] = useState(loadSubmittedProposals);

  useEffect(() => {
    let cancelled = false;

    getOrCreateDefaultTeamId()
      .then((teamId) => getTimezones(teamId))
      .then((list) => {
        if (!cancelled) {
          setMembers(list.map((member) => (
            member.user_id === user.id
              ? { ...member, name: user.name, country: user.country, timezone: user.timezone }
              : member
          )));
        }
      })
      .catch(() => { /* 팀이 아직 없으면 조용히 빈 상태로 둔다 */ });

    getNotifications().then((list) => {
      if (!cancelled) setNotifications(list);
    });

    getProposals().then(async (list) => {
      const results = await Promise.all(
        list.map((proposal) => getProposalStatus(proposal.id).catch(() => null)),
      );
      if (cancelled) return;

      const opinionMap = results.reduce<Record<string, Opinion[]>>((acc, result) => {
        if (result) acc[result.proposal.id] = result.opinions;
        return acc;
      }, {});

      const now = Date.now();
      const visible = list.filter((proposal) => !isComplete(proposal)
        || now - new Date(proposal.completed_at ?? proposal.deadline).getTime() < COMPLETED_VISIBLE_MS);
      setOpinionsByProposal(opinionMap);
      setProposals(sortProposals(visible));
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const syncLastOpenedChat = () => setLastOpenedChat(loadLastOpenedChat());
    const syncGroups = () => setWorkspaceGroups(loadGroups());
    window.addEventListener(LAST_OPENED_CHAT_CHANGED_EVENT, syncLastOpenedChat);
    window.addEventListener(GROUPS_CHANGED_EVENT, syncGroups);
    return () => {
      window.removeEventListener(LAST_OPENED_CHAT_CHANGED_EVENT, syncLastOpenedChat);
      window.removeEventListener(GROUPS_CHANGED_EVENT, syncGroups);
    };
  }, []);

  useEffect(() => {
    if (!proposalMenu) return;
    const closeMenu = () => setProposalMenu(null);
    window.addEventListener("mousedown", closeMenu);
    return () => window.removeEventListener("mousedown", closeMenu);
  }, [proposalMenu]);

  useEffect(() => {
    const expiries = proposals
      .filter(isComplete)
      .map((proposal) => new Date(proposal.completed_at ?? proposal.deadline).getTime() + COMPLETED_VISIBLE_MS)
      .filter((expiry) => expiry > Date.now());
    if (expiries.length === 0) return;

    const timeout = window.setTimeout(() => {
      const now = Date.now();
      setProposals((current) => current.filter((proposal) => !isComplete(proposal)
        || now < new Date(proposal.completed_at ?? proposal.deadline).getTime() + COMPLETED_VISIBLE_MS));
    }, Math.min(...expiries) - Date.now() + 50);
    return () => window.clearTimeout(timeout);
  }, [proposals]);

  const deleteProposal = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      // Backend는 DRAFT 상태에서만 삭제를 허용한다(그 외 409) — 메뉴도 DRAFT일 때만 노출되지만, 그 사이 상태가 바뀌었을 수 있다.
      await deleteProposalApi(target.id);
    } catch {
      window.alert("삭제에 실패했습니다. 이미 게시된 제안일 수 있어요.");
      return;
    }
    setSubmittedProposals((current) => current.filter((item) => item.id !== target.id));
    setProposals((current) => current.filter((item) => item.id !== target.id));
    setExpandedId((current) => current === target.id ? null : current);
  };

  const openCompletion = (proposal: Proposal) => {
    setCompletionTarget(proposal);
    setCompletionComment("");
    setCompletionError(null);
    setProposalMenu(null);
  };

  const completeProposal = async () => {
    if (!completionTarget || !completionComment.trim()) return;
    const opinions = opinionsByProposal[completionTarget.id] ?? [];
    const resultSummary = buildResultSummary(opinions);
    const finalComment = completionComment.trim();

    setIsCompleting(true);
    setCompletionError(null);
    let completed: Proposal;
    try {
      completed = await completeProposalApi(completionTarget.id, finalComment);
    } catch {
      setCompletionError("완료 처리에 실패했습니다. AI 합의 요약이 먼저 진행되어야 완료할 수 있습니다.");
      setIsCompleting(false);
      return;
    }

    const storedProposal = loadSubmittedProposals().find((proposal) => proposal.id === completionTarget.id);
    const targetGroup = loadGroups().find((group) => group.name === storedProposal?.targetGroup);
    if (targetGroup) {
      const chatId = `group-${targetGroup.id}`;
      saveMessages(chatId, [
        ...loadMessages(chatId),
        {
          id: crypto.randomUUID(),
          sender: "me",
          text: `[합의 결과] ${completionTarget.title} · ${resultSummary} 최종 결정: ${finalComment}`,
          createdAt: completed.completed_at ?? new Date().toISOString(),
        },
      ]);
    }

    setProposals((current) => sortProposals(current.map((item) => item.id === completionTarget.id
      ? { ...item, status: completed.status, completed_at: completed.completed_at }
      : item)));
    setExpandedId(null);
    setCompletionTarget(null);
    setCompletionComment("");
    setIsCompleting(false);
  };

  const activeProposalCount = proposals.filter((proposal) => proposal.status === "OPEN").length;
  const storedAnalysisProposal = analysisTarget
    ? submittedProposals.find((proposal) => proposal.id === analysisTarget.id)
    : undefined;
  const analysisOpinions = analysisTarget ? opinionsByProposal[analysisTarget.id] ?? [] : [];
  const analysisSummary = storedAnalysisProposal?.result_summary ?? buildResultSummary(analysisOpinions);
  const finalDecision = storedAnalysisProposal?.final_comment
    ?? "조건부 및 반대 의견의 우려를 반영해 실행 범위를 조정하고, 팀에 최종 내용을 공유합니다.";
  const clockMembers = !lastOpenedChat
    ? members
    : lastOpenedChat.type === "DIRECT"
      ? members.filter((member) => member.name === lastOpenedChat.name)
      : members.slice(0, Math.max(1, Math.min(lastOpenedChat.memberCount ?? members.length, members.length)));
  const clockTitle = !lastOpenedChat
    ? "지금, 팀은 어디쯤 깨어있을까요"
    : lastOpenedChat.type === "DIRECT"
      ? `${lastOpenedChat.name}의 현재 시간`
      : `${lastOpenedChat.name} 멤버들은 어디쯤 깨어있을까요`;

  const markAllRead = () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    unreadIds.forEach((id) => markNotificationRead(id));
  };

  const markRead = (notification: Notification) => {
    setNotifications((prev) => prev.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)));
    markNotificationRead(notification.id);
  };

  const selectNotification = (notification: Notification) => {
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
    markNotificationRead(notification.id);
    if (notification.type === "FRIEND_REQUEST") {
      setIsFriendManagerOpen(true);
      return;
    }
    if (notification.proposal_id) setExpandedId(notification.proposal_id);
  };

  return (
    <div className="min-h-screen bg-void">
      <header className="sticky top-0 z-20 backdrop-blur bg-void/80 border-b border-surface-3">
        <div className="flex w-full items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-lg text-ink">Meridian</span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationPanel
              notifications={notifications}
              onMarkAllRead={markAllRead}
              onMarkRead={markRead}
              onSelect={selectNotification}
            />
            <ConnectionButton onClick={() => setIsFriendManagerOpen(true)} />
            <div className="flex items-center gap-2 pl-3 border-l border-surface-3">
              <UserHandleButton user={user} onOpenProfile={onOpenProfile} onLogout={onLogout} />
            </div>
          </div>
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-65px)] w-full lg:grid-cols-[18%_82%]">
        <div className="hidden h-full border-r border-surface-3 px-4 lg:block">
          <WorkspaceSidebar user={user} />
        </div>

        <div className="min-w-0 space-y-8 px-4 py-8 sm:px-6 2xl:px-8">
          <WorldClockStrip members={clockMembers.length > 0 ? clockMembers : members} title={clockTitle} />

          <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-display text-lg text-ink">제안 응답 현황</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-faint">{activeProposalCount}개 진행 중</span>
              <button
                type="button"
                onClick={onCreateProposal}
                className="rounded-full border border-ink bg-ink px-3.5 py-1.5 text-xs font-medium text-void transition hover:opacity-90"
              >
                제안 작성
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {proposals.map((proposal) => {
              const isOpen = expandedId === proposal.id;
              const opinions = opinionsByProposal[proposal.id] ?? [];
              const submittedProposal = submittedProposals.find((item) => item.id === proposal.id);
              const targetGroupName = submittedProposal?.targetGroup ?? MOCK_PROPOSAL_GROUP_NAMES[proposal.id];
              const total = workspaceGroups.find((group) => group.name === targetGroupName)?.memberCount ?? members.length;
              const proposalMembers = members.slice(0, total);
              const proposalMemberIds = new Set(proposalMembers.map((member) => member.user_id));
              const responded = opinions.filter((opinion) => proposalMemberIds.has(opinion.user_id)).length;
              const isComplete = proposal.status === "COMPLETED";
              const orderedMembers = [...proposalMembers].sort((a, b) => {
                const aOpinion = opinions.find((opinion) => opinion.user_id === a.user_id);
                const bOpinion = opinions.find((opinion) => opinion.user_id === b.user_id);

                if (!aOpinion && !bOpinion) return 0;
                if (!aOpinion) return 1;
                if (!bOpinion) return -1;

                if (isComplete) {
                  const stanceDifference = STANCE_ORDER[aOpinion.stance] - STANCE_ORDER[bOpinion.stance];
                  if (stanceDifference !== 0) return stanceDifference;
                }

                return new Date(aOpinion.created_at).getTime() - new Date(bOpinion.created_at).getTime();
              });

              return (
                <div
                  key={proposal.id}
                  className="overflow-hidden rounded-2xl border border-surface-3 bg-surface"
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setProposalMenu({ proposal, x: event.clientX, y: event.clientY });
                  }}
                >
                  <div className="flex items-center px-5 py-4 transition hover:bg-surface-2/60">
                    <button onClick={() => setExpandedId(isOpen ? null : proposal.id)} className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm leading-5 text-ink" style={{ wordBreak: "keep-all", overflowWrap: "break-word", textWrap: "pretty" }}>{proposal.title}</p>
                        <p className="mt-1 text-[11px] text-ink-faint">{responded}/{total}명 응답 완료</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <ProposalStatusBadge status={proposal.status} />
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-ink-faint transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </button>
                  </div>

                  {isOpen && (
                    <div className="border-t border-surface-3 px-5 pb-4 pt-1">
                      <div className="divide-y divide-surface-3/60">
                      {orderedMembers.map((member) => {
                        const opinion = opinions.find((o) => o.user_id === member.user_id);
                        return (
                          <TeamMemberRow
                            key={member.user_id}
                            member={member}
                            opinion={opinion}
                            viewerTimezone={user.timezone}
                            viewerLanguage={user.preferred_language}
                            onWriteOpinion={!isComplete && member.user_id === user.id ? () => onOpenProposal(proposal.id) : undefined}
                          />
                        );
                      })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </section>
        </div>
      </main>
      {proposalMenu && (
        <div
          className="fixed z-50 w-36 overflow-hidden rounded-lg border border-surface-3 bg-surface-2 py-1 shadow-panel"
          style={{
            left: Math.min(proposalMenu.x, window.innerWidth - 155),
            top: Math.min(proposalMenu.y, window.innerHeight - 145),
          }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {proposalMenu.proposal.author_id === user.id ? (
            <>
              {isComplete(proposalMenu.proposal) && (
                <button type="button" onClick={() => { setAnalysisTarget(proposalMenu.proposal); setProposalMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-ink-dim transition hover:bg-surface-3 hover:text-ink">결과 분석</button>
              )}
              {proposalMenu.proposal.status === "DRAFT" && (
                <>
                  <button type="button" onClick={() => onEditProposal(proposalMenu.proposal.id)} className="w-full px-3 py-2 text-left text-xs text-ink-dim transition hover:bg-surface-3 hover:text-ink">수정하기</button>
                  <button type="button" onClick={() => { setDeleteTarget(proposalMenu.proposal); setProposalMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-ink-dim transition hover:bg-surface-3 hover:text-alert">삭제하기</button>
                </>
              )}
              {proposalMenu.proposal.status === "CONSENSUS_READY" && (
                <button type="button" onClick={() => openCompletion(proposalMenu.proposal)} className="w-full px-3 py-2 text-left text-xs text-ink-dim transition hover:bg-surface-3 hover:text-consensus">완료하기</button>
              )}
            </>
          ) : (
            <>
              {isComplete(proposalMenu.proposal) && (
                <button type="button" onClick={() => { setAnalysisTarget(proposalMenu.proposal); setProposalMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-ink-dim transition hover:bg-surface-3 hover:text-ink">결과 분석</button>
              )}
              <button type="button" onClick={() => onViewProposal(proposalMenu.proposal.id)} className="w-full px-3 py-2 text-left text-xs text-ink-dim transition hover:bg-surface-3 hover:text-ink">상세 정보 보기</button>
            </>
          )}
        </div>
      )}
      {completionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="completion-title" className="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-6 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium text-consensus">합의 완료</p>
                <h2 id="completion-title" className="mt-1 font-display text-lg leading-snug text-ink">{completionTarget.title}</h2>
              </div>
              <button type="button" onClick={() => setCompletionTarget(null)} aria-label="닫기" className="text-lg text-ink-dim hover:text-ink">×</button>
            </div>
            <label htmlFor="completion-comment" className="mb-2 mt-5 block text-xs font-medium text-ink-dim">최종 결정</label>
            <textarea
              id="completion-comment"
              value={completionComment}
              onChange={(event) => setCompletionComment(event.target.value)}
              maxLength={300}
              rows={4}
              placeholder="논의 결과 최종적으로 어떻게 진행할지 남겨주세요."
              className="w-full resize-none rounded-xl border border-surface-3 bg-surface-2 px-3.5 py-3 text-sm leading-6 text-ink outline-none transition focus:border-night"
            />
            <p className="mt-2 text-[10px] text-ink-faint">완료 후 결과 분석과 최종 결정이 그룹 채팅에 공유됩니다.</p>
            {completionError && <p className="mt-2 text-[11px] text-alert">{completionError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setCompletionTarget(null)} className="px-3 py-2 text-xs text-ink-dim hover:text-ink">취소</button>
              <button type="button" onClick={completeProposal} disabled={!completionComment.trim() || isCompleting} className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-void transition disabled:cursor-default disabled:opacity-35">{isCompleting ? "처리 중..." : "완료 처리"}</button>
            </div>
          </section>
        </div>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-proposal-title" className="w-full max-w-sm rounded-2xl border border-surface-3 bg-surface p-6 shadow-panel">
            <h2 id="delete-proposal-title" className="font-display text-lg text-ink">제안을 삭제할까요?</h2>
            <p className="mt-2 text-sm leading-6 text-ink-dim">{deleteTarget.title}</p>
            <p className="mt-2 text-xs text-ink-faint">등록된 의견과 응답 기록도 함께 삭제됩니다.</p>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-lg border border-surface-3 py-2.5 text-sm text-ink-dim transition hover:text-ink">취소</button>
              <button type="button" onClick={deleteProposal} className="flex-1 rounded-lg bg-alert py-2.5 text-sm font-semibold text-void transition hover:opacity-90">삭제</button>
            </div>
          </section>
        </div>
      )}
      {analysisTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="analysis-title" className="w-full max-w-lg rounded-2xl border border-surface-3 bg-surface p-6 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium text-consensus">결과 분석</p>
                <h2 id="analysis-title" className="mt-1 font-display text-xl leading-snug text-ink">{analysisTarget.title}</h2>
              </div>
              <button type="button" onClick={() => setAnalysisTarget(null)} aria-label="닫기" className="text-lg text-ink-dim hover:text-ink">×</button>
            </div>
            <div className="mt-6 border-l-2 border-night/60 pl-4">
              <p className="text-xs font-semibold text-ink">의견 분석</p>
              <p className="mt-2 text-sm leading-6 text-ink-dim">{analysisSummary}</p>
            </div>
            <div className="mt-4 border-l-2 border-consensus/60 pl-4">
              <p className="text-xs font-semibold text-ink">최종 결정</p>
              <p className="mt-2 text-sm leading-6 text-ink-dim">{finalDecision}</p>
            </div>
            <button type="button" onClick={() => setAnalysisTarget(null)} className="mt-6 w-full rounded-lg border border-surface-3 py-2.5 text-xs font-medium text-ink-dim transition hover:text-ink">확인</button>
          </section>
        </div>
      )}
      <FriendManagerModal open={isFriendManagerOpen} onClose={() => setIsFriendManagerOpen(false)} />
    </div>
  );
}
