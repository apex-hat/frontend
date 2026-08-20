import { useEffect, useState } from "react";
import type { AuthUser, Notification, Opinion, Proposal } from "../../../types";
import {
  completeProposal as completeProposalApi,
  deleteProposal as deleteProposalApi,
  getNotifications,
  getProposalStatus,
  getProposals,
  getTeamMembers,
  getTimezones,
  markNotificationRead,
} from "../../../lib/api";
import type { FriendSummary, TimezoneEntry } from "../../../lib/api";
import WorldClockStrip from "./WorldClockStrip";
import NotificationPanel from "./NotificationPanel";
import ProposalStatusBadge from "./ProposalStatusBadge";
import TeamMemberRow from "./TeamMemberRow";
import WorkspaceSidebar from "../../workspace/components/WorkspaceSidebar";
import FriendManagerModal from "../../workspace/components/FriendManagerModal";
import UserHandleButton from "../../workspace/components/UserHandleButton";
import BrandMark from "../../../components/branding/BrandMark";
import ConnectionButton from "../../workspace/components/ConnectionButton";
import { useTeamSwitcher } from "../../workspace/useTeamSwitcher";
import TeamManagerModal from "../../workspace/components/TeamManagerModal";
import { useTeamEvents } from "../../../lib/teamEvents";

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) => setExpandedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const [opinionsByProposal, setOpinionsByProposal] = useState<Record<string, Opinion[]>>({});
  const [isFriendManagerOpen, setIsFriendManagerOpen] = useState(false);
  const [friendManagerMode, setFriendManagerMode] = useState<"friend" | "team">("friend");
  const [proposalMenu, setProposalMenu] = useState<{ proposal: Proposal; x: number; y: number } | null>(null);
  const [completionTarget, setCompletionTarget] = useState<Proposal | null>(null);
  const [completionComment, setCompletionComment] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [analysisTarget, setAnalysisTarget] = useState<Proposal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null);
  const [chatFriend, setChatFriend] = useState<FriendSummary | null>(null);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [membersVersion, setMembersVersion] = useState(0);
  const [realtimeTick, setRealtimeTick] = useState(0);
  const { teams, selectedTeamId, isLoading: isLoadingTeams, selectTeam, createGroup, renameTeam, removeGroup, leaveGroup, reload: reloadTeams } = useTeamSwitcher(user);
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? null;

  // 같은 팀의 다른 사람이 제안/의견을 생성·수정·삭제하면 서버가 WebSocket으로 알려준다 —
  // 폴링 간격(10초)을 기다리지 않고 즉시 아래 useEffect의 목록 재조회를 트리거한다.
  useTeamEvents(selectedTeamId, () => setRealtimeTick((tick) => tick + 1));

  useEffect(() => {
    if (isLoadingTeams) return;
    let cancelled = false;

    const load = () => {
      if (selectedTeamId) {
        Promise.all([
          getTeamMembers(selectedTeamId),
          getTimezones(selectedTeamId).catch(() => []),
        ])
          .then(([profiles, timezones]) => {
            if (!cancelled) {
              const timezoneById = new Map(timezones.map((member) => [member.user_id, member]));
              setMembers(profiles.map((profile, index) => {
                const timezoneMember = timezoneById.get(profile.user_id);
                return {
                  user_id: profile.user_id,
                  name: profile.user_id === user.id ? user.name : profile.name,
                  country: profile.user_id === user.id ? user.country : profile.country,
                  timezone: profile.user_id === user.id ? user.timezone : profile.timezone,
                  culture_tag: profile.culture_tag,
                  role: profile.role,
                  avatarColor: timezoneMember?.avatarColor ?? ["#F2A65A", "#63C7A6", "#7C8FE0", "#E8607A"][index % 4],
                };
              }));
            }
          })
          .catch(() => { /* 팀이 아직 없으면 조용히 빈 상태로 둔다 */ });
      } else {
        // 전체 보기: 특정 팀 하나의 로스터가 없으므로 팀원/시간대 위젯은 비운다.
        setMembers([]);
      }

      getNotifications().then((list) => {
        if (!cancelled) setNotifications(list);
      });

      getProposals(selectedTeamId ?? undefined).then(async (list) => {
        // 전체 보기에서는 카드마다 팀이 달라 응답 현황/펼치기를 보여주지 않으므로 조회 자체를 건너뛴다.
        const opinionMap: Record<string, Opinion[]> = {};
        if (selectedTeamId) {
          const results = await Promise.all(
            list.map((proposal) => getProposalStatus(proposal.id).catch(() => null)),
          );
          if (cancelled) return;
          results.forEach((result) => {
            if (result) opinionMap[result.proposal.id] = result.opinions;
          });
        }
        if (cancelled) return;

        const now = Date.now();
        const visible = list.filter((proposal) => !isComplete(proposal)
          || now - new Date(proposal.completed_at ?? proposal.deadline).getTime() < COMPLETED_VISIBLE_MS);
        setOpinionsByProposal(opinionMap);
        setProposals(sortProposals(visible));
      });
    };

    load();
    // 팀원이 새 제안을 올려도 새로고침 없이 보이도록 주기적으로 다시 조회한다.
    const intervalId = window.setInterval(load, 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user, selectedTeamId, isLoadingTeams, membersVersion, realtimeTick]);

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
      await deleteProposalApi(target.id);
    } catch {
      window.alert("삭제에 실패했습니다. 합의가 이미 확정됐거나 권한이 없을 수 있어요.");
      return;
    }
    setProposals((current) => current.filter((item) => item.id !== target.id));
    setExpandedIds((current) => {
      if (!current.has(target.id)) return current;
      const next = new Set(current);
      next.delete(target.id);
      return next;
    });
  };

  const openCompletion = (proposal: Proposal) => {
    setCompletionTarget(proposal);
    setCompletionComment("");
    setCompletionError(null);
    setProposalMenu(null);
  };

  const completeProposal = async () => {
    if (!completionTarget || !completionComment.trim()) return;
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

    setProposals((current) => sortProposals(current.map((item) => item.id === completionTarget.id
      ? { ...item, status: completed.status, completed_at: completed.completed_at }
      : item)));
    setExpandedIds((current) => {
      const next = new Set(current);
      next.delete(completionTarget.id);
      return next;
    });
    setCompletionTarget(null);
    setCompletionComment("");
    setIsCompleting(false);
  };

  const activeProposalCount = proposals.filter((proposal) => proposal.status === "OPEN").length;
  const analysisOpinions = analysisTarget ? opinionsByProposal[analysisTarget.id] ?? [] : [];
  const analysisSummary = buildResultSummary(analysisOpinions);
  const finalDecision = "조건부 및 반대 의견의 우려를 반영해 실행 범위를 조정하고, 팀에 최종 내용을 공유합니다.";

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
      setFriendManagerMode("friend");
      setIsFriendManagerOpen(true);
      return;
    }
    if (notification.type === "TEAM_INVITE") {
      setFriendManagerMode("team");
      setIsFriendManagerOpen(true);
      return;
    }
    if (notification.proposal_id) {
      const proposalId = notification.proposal_id;
      setExpandedIds((current) => new Set(current).add(proposalId));
    }
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
            <ConnectionButton onClick={() => { setFriendManagerMode("friend"); setIsFriendManagerOpen(true); }} />
            <div className="flex items-center gap-2 pl-3 border-l border-surface-3">
              <UserHandleButton user={user} onOpenProfile={onOpenProfile} onLogout={onLogout} />
            </div>
          </div>
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-65px)] w-full lg:grid-cols-[18%_82%]">
        <div className="hidden h-full border-r border-surface-3 px-4 lg:block">
          <WorkspaceSidebar
            key={`${selectedTeamId ?? "none"}-${membersVersion}`}
            user={user}
            teams={teams}
            selectedTeamId={selectedTeamId}
            isLoadingTeams={isLoadingTeams}
            onSelectTeam={selectTeam}
            onCreateGroup={createGroup}
            chatFriend={chatFriend}
            onCloseChat={() => setChatFriend(null)}
            onOpenTeamManager={() => setIsTeamManagerOpen(true)}
          />
        </div>

        <div className="min-w-0 space-y-8 px-4 py-8 sm:px-6 2xl:px-8">
          {selectedTeamId ? (
            <WorldClockStrip members={members} title="지금, 팀은 어디쯤 깨어있을까요" />
          ) : (
            <div className="rounded-2xl border border-surface-3 bg-surface p-6 text-sm text-ink-dim">
              전체 팀의 제안을 모아보고 있어요. 팀을 선택하면 그 팀의 근무 시간대를 볼 수 있어요.
            </div>
          )}

          <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-display text-lg text-ink">제안 응답 현황</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-faint">{activeProposalCount}개 진행 중</span>
              <button
                type="button"
                onClick={onCreateProposal}
                disabled={!selectedTeamId}
                title={!selectedTeamId ? "팀을 선택하면 제안을 작성할 수 있어요" : undefined}
                className="rounded-full border border-ink bg-ink px-3.5 py-1.5 text-xs font-medium text-void transition hover:opacity-90 disabled:cursor-default disabled:opacity-40"
              >
                제안 작성
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {proposals.map((proposal) => {
              const isOpen = expandedIds.has(proposal.id);
              const opinions = opinionsByProposal[proposal.id] ?? [];
              // CONSENSUS_READY 이상은 Backend가 "그 시점의 팀원 전원 응답 완료" 조건으로만 전이시키므로,
              // 이후 팀에 새 팀원이 들어와도 이미 마감된 응답 현황(N/N)이 실시간 팀원 수 때문에 흔들리면 안 된다.
              const isClosedForResponses = ["CONSENSUS_READY", "CONSENSUS_COMPLETED", "COMPLETED"].includes(proposal.status);
              const proposalMemberIds = new Set(members.map((member) => member.user_id));
              const total = isClosedForResponses ? opinions.length : members.length;
              const responded = isClosedForResponses
                ? opinions.length
                : opinions.filter((opinion) => proposalMemberIds.has(opinion.user_id)).length;
              const isComplete = proposal.status === "COMPLETED";
              // 마감된 제안은 그 시점에 실제로 응답한 팀원만 펼침 목록에 남긴다 — 이후 합류한 팀원까지
              // "응답 안 함"으로 섞여 보이면 응답 현황을 왜곡해서 보여주는 셈이 된다.
              const displayedMembers = isClosedForResponses
                ? members.filter((member) => opinions.some((opinion) => opinion.user_id === member.user_id))
                : members;
              const orderedMembers = [...displayedMembers].sort((a, b) => {
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
                  <div className="flex items-center gap-3 px-5 py-4 transition hover:bg-surface-2/60">
                    <button type="button" onClick={() => selectedTeamId && toggleExpanded(proposal.id)} className="flex min-w-0 flex-1 items-center text-left">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="line-clamp-2 text-sm leading-5 text-ink" style={{ wordBreak: "keep-all", overflowWrap: "break-word", textWrap: "pretty" }}>{proposal.title}</p>
                          {!selectedTeamId && (
                            <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-ink-faint">{proposal.target_team_name}</span>
                          )}
                        </div>
                        {proposal.author_name && (
                          <p className="mt-1 text-[11px] text-ink-faint">
                            작성자 {proposal.author_name}{proposal.author_id === user.id ? " (나)" : ""}
                          </p>
                        )}
                        {selectedTeamId && <p className="mt-0.5 text-[11px] text-ink-faint">{responded}/{total}명 응답 완료</p>}
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <ProposalStatusBadge status={proposal.status} />
                      <button
                        type="button"
                        onClick={() => onOpenProposal(proposal.id)}
                        className="rounded-md border border-surface-3 px-2.5 py-1 text-[10px] font-medium text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                      >
                        상세 보기
                      </button>
                      <button
                        type="button"
                        aria-label="제안 메뉴 열기"
                        onClick={(event) => {
                          event.stopPropagation();
                          const rect = event.currentTarget.getBoundingClientRect();
                          setProposalMenu({ proposal, x: rect.left, y: rect.bottom + 4 });
                        }}
                        className="rounded-md border border-surface-3 px-1.5 py-1 text-[10px] font-medium text-ink-faint transition hover:bg-surface-2 hover:text-ink"
                      >
                        ⋮
                      </button>
                      {selectedTeamId && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(proposal.id)}
                          aria-label={isOpen ? "접기" : "펼치기"}
                          className="p-1 text-ink-faint transition hover:text-ink"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                      )}
                    </div>
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
      {proposalMenu && (() => {
        const isAuthor = proposalMenu.proposal.author_id === user.id;
        // PM은 본인이 속한(=현재 선택된) 팀 안에서만 다른 사람의 제안도 관리(모더레이션)할 수 있다.
        // 전체 보기(팀 미선택) 상태에서는 이 제안이 어느 팀 소속인지와 무관하게 PM 여부를 신뢰있게 알 수 없어 제외한다.
        const isPmOfTeam = selectedTeamId === proposalMenu.proposal.target_team_id
          && members.some((member) => member.user_id === user.id && member.role === "PM");
        const canManage = isAuthor || isPmOfTeam;
        const isEditable = !["CONSENSUS_READY", "CONSENSUS_COMPLETED", "COMPLETED"].includes(proposalMenu.proposal.status);

        return (
          <div
            className="fixed z-50 w-36 overflow-hidden rounded-lg border border-surface-3 bg-surface-2 py-1 shadow-panel"
            style={{
              left: Math.min(proposalMenu.x, window.innerWidth - 155),
              top: Math.min(proposalMenu.y, window.innerHeight - 145),
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {isComplete(proposalMenu.proposal) && (
              <button type="button" onClick={() => { setAnalysisTarget(proposalMenu.proposal); setProposalMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-ink-dim transition hover:bg-surface-3 hover:text-ink">결과 분석</button>
            )}
            {canManage && isEditable && (
              <>
                <button type="button" onClick={() => onEditProposal(proposalMenu.proposal.id)} className="w-full px-3 py-2 text-left text-xs text-ink-dim transition hover:bg-surface-3 hover:text-ink">수정하기</button>
                <button type="button" onClick={() => { setDeleteTarget(proposalMenu.proposal); setProposalMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-ink-dim transition hover:bg-surface-3 hover:text-alert">삭제하기</button>
              </>
            )}
            {isAuthor && proposalMenu.proposal.status === "CONSENSUS_COMPLETED" && (
              <button type="button" onClick={() => openCompletion(proposalMenu.proposal)} className="w-full px-3 py-2 text-left text-xs text-ink-dim transition hover:bg-surface-3 hover:text-consensus">완료하기</button>
            )}
            {/* 위 조건에 해당하는 항목이 없어 메뉴가 비어 보이는 경우(예: 합의 확정 이후 상태를 열람만 하는 경우)를 대비한 항상 뜨는 항목 */}
            <button type="button" onClick={() => onViewProposal(proposalMenu.proposal.id)} className="w-full px-3 py-2 text-left text-xs text-ink-dim transition hover:bg-surface-3 hover:text-ink">상세 정보 보기</button>
          </div>
        );
      })()}
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
      <FriendManagerModal open={isFriendManagerOpen} onClose={() => setIsFriendManagerOpen(false)} currentUserId={user.id} teamId={selectedTeamId} onOpenChat={setChatFriend} initialMode={friendManagerMode} onTeamJoined={reloadTeams} />
      <TeamManagerModal open={isTeamManagerOpen} onClose={() => setIsTeamManagerOpen(false)} user={user} team={selectedTeam} onMembersChanged={() => setMembersVersion((value) => value + 1)} onRenameTeam={renameTeam} onDeleteTeam={removeGroup} onLeaveTeam={leaveGroup} />
    </div>
  );
}
