import { useEffect, useState } from "react";
import type { AuthUser, Notification, Opinion, Proposal } from "../../../types";
import { getNotifications, getProposalStatus, getProposals, getTimezones, markNotificationRead } from "../../../lib/api";
import type { TimezoneEntry } from "../../../lib/api";
import WorldClockStrip from "./WorldClockStrip";
import NotificationPanel from "./NotificationPanel";
import ProposalStatusBadge from "./ProposalStatusBadge";
import TeamMemberRow from "./TeamMemberRow";
import { formatLocalTime } from "../../../lib/timezone";

const STANCE_ORDER: Record<Opinion["stance"], number> = {
  AGREE: 0,
  CONDITIONAL: 1,
  DISAGREE: 2,
};

interface DashboardProps {
  user: AuthUser;
  onLogout: () => void;
  onOpenProposals: () => void;
}

export default function Dashboard({ user, onLogout, onOpenProposals }: DashboardProps) {
  const [members, setMembers] = useState<TimezoneEntry[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [opinionsByProposal, setOpinionsByProposal] = useState<Record<string, Opinion[]>>({});

  useEffect(() => {
    let cancelled = false;

    getTimezones().then((list) => {
      if (!cancelled) setMembers(list);
    });

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

      setOpinionsByProposal(opinionMap);
      setProposals(list);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeProposalCount = proposals.filter((proposal) => proposal.status === "OPEN").length;

  const markAllRead = () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    unreadIds.forEach((id) => markNotificationRead(id));
  };

  const selectNotification = (notification: Notification) => {
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
    markNotificationRead(notification.id);
    if (notification.proposal_id) setExpandedId(notification.proposal_id);
  };

  return (
    <div className="min-h-screen bg-void">
      <header className="sticky top-0 z-20 backdrop-blur bg-void/80 border-b border-surface-3">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-lg text-ink">Meridian</span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationPanel
              notifications={notifications}
              onMarkAllRead={markAllRead}
              onSelect={selectNotification}
            />
            <div className="flex items-center gap-2 pl-3 border-l border-surface-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-ink leading-tight">{user.name}</p>
                <p className="font-mono text-[10px] text-ink-faint leading-tight">
                  {formatLocalTime(user.timezone)} · {user.timezone.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="text-xs text-ink-dim hover:text-ink border border-surface-3 rounded-full px-3 py-1.5"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <WorldClockStrip members={members} />

        <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-display text-lg text-ink">제안 응답 현황</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-faint">{activeProposalCount}개 진행 중</span>
              <button
                type="button"
                onClick={onOpenProposals}
                className="text-xs text-ink border border-surface-3 rounded-full px-3 py-1.5 hover:bg-surface-2 transition"
              >
                제안 관리
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {proposals.map((proposal) => {
              const isOpen = expandedId === proposal.id;
              const opinions = opinionsByProposal[proposal.id] ?? [];
              const responded = opinions.length;
              const total = members.length;
              const isComplete = proposal.status === "CONSENSUS_DONE" || proposal.status === "CLOSED";
              const orderedMembers = [...members].sort((a, b) => {
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
                <div key={proposal.id} className="rounded-2xl bg-surface border border-surface-3 overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : proposal.id)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-2/60 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">{proposal.title}</p>
                      <p className="text-[11px] text-ink-faint mt-1">
                        {responded}/{total}명 응답 완료
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <ProposalStatusBadge status={proposal.status} />
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`text-ink-faint transition-transform ${isOpen ? "rotate-180" : ""}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 border-t border-surface-3 divide-y divide-surface-3/60">
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
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
