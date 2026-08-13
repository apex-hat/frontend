import { useEffect, useState } from "react";
import type { AuthUser, Notification, Opinion, Proposal } from "../../../types";
import { getNotifications, getProposalStatus, getProposals, getTimezones, markNotificationRead } from "../../../lib/api";
import type { TimezoneEntry } from "../../../lib/api";
import WorldClockStrip from "./WorldClockStrip";
import NotificationPanel from "./NotificationPanel";
import ProposalStatusBadge from "./ProposalStatusBadge";
import TeamMemberRow from "./TeamMemberRow";
import { formatLocalTime } from "../../../lib/timezone";

interface DashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [members, setMembers] = useState<TimezoneEntry[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [opinionsByProposal, setOpinionsByProposal] = useState<Record<string, Opinion[]>>({});

  useEffect(() => {
    getTimezones().then(setMembers);
    getProposals().then((list) => {
      setProposals(list);
      setExpandedId((prev) => prev ?? list[0]?.id ?? null);
    });
    getNotifications().then(setNotifications);
  }, []);

  useEffect(() => {
    if (!expandedId || opinionsByProposal[expandedId]) return;
    getProposalStatus(expandedId).then((result) => {
      if (!result) return;
      setOpinionsByProposal((prev) => ({ ...prev, [expandedId]: result.opinions }));
    });
  }, [expandedId, opinionsByProposal]);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

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
            <span className="font-mono text-[10px] text-ink-faint border border-surface-3 rounded-full px-2 py-0.5">
              MOCK DATA
            </span>
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
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-lg text-ink">제안 응답 현황</h2>
            <span className="text-xs text-ink-faint">{proposals.length}개 진행 중</span>
          </div>

          <div className="space-y-3">
            {proposals.map((proposal) => {
              const isOpen = expandedId === proposal.id;
              const opinions = opinionsByProposal[proposal.id] ?? [];
              const responded = opinions.length;
              const total = members.length;

              return (
                <div key={proposal.id} className="rounded-2xl bg-surface border border-surface-3 overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : proposal.id)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-2/60 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">{proposal.title}</p>
                      <p className="text-[11px] text-ink-faint mt-1">
                        {isOpen ? `${responded}/${total}명 응답 완료` : "펼쳐서 응답 현황 보기"}
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
                      {members.map((member) => {
                        const opinion = opinions.find((o) => o.user_id === member.user_id);
                        return <TeamMemberRow key={member.user_id} member={member} opinion={opinion} />;
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
