import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import ProposalForm from "./ProposalForm";
import ProposalInfoPage from "./ProposalInfoPage";
import ConsensusDevPage from "../consensus/ConsensusDevPage";
import { getNotifications, getProposal, getTeamMembers, markNotificationRead, type FriendSummary } from "../../lib/api";
import type { AuthUser, Notification, Proposal } from "../../types";
import WorkspaceSidebar from "../../features/workspace/components/WorkspaceSidebar";
import UserHandleButton from "../../features/workspace/components/UserHandleButton";
import FriendManagerModal from "../../features/workspace/components/FriendManagerModal";
import NotificationPanel from "../../features/dashboard/components/NotificationPanel";
import BrandMark from "../../components/branding/BrandMark";
import ConnectionButton from "../../features/workspace/components/ConnectionButton";
import { useTeamSwitcher } from "../../features/workspace/useTeamSwitcher";
import TeamManagerModal from "../../features/workspace/components/TeamManagerModal";

interface Props {
  user: AuthUser;
  onBackToDashboard: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

function ProposalFormRoute({ teamId, onSubmitted }: { teamId: string | null; onSubmitted: () => void }) {
  if (!teamId) return <p className="py-16 text-center text-sm text-ink-dim">팀 정보를 불러오는 중...</p>;
  return <ProposalForm teamId={teamId} onSubmitted={onSubmitted} />;
}

/** 작성자 본인의 작성 중/응답 진행 중 제안만 수정할 수 있다. 합의가 확정된 기록은 잠근다. */
function ProposalEditRoute({ userId, onSubmitted }: { userId: string; onSubmitted: () => void }) {
  const { proposalId } = useParams();
  const [proposal, setProposal] = useState<Proposal | null | undefined>(null);

  useEffect(() => {
    if (!proposalId) return;
    let cancelled = false;
    getProposal(proposalId)
      .then((item) => {
        if (!cancelled) setProposal(item);
      })
      .catch(() => {
        if (!cancelled) setProposal(undefined);
      });
    return () => { cancelled = true; };
  }, [proposalId]);

  if (proposal === null) return <p className="py-16 text-center text-sm text-ink-dim">불러오는 중...</p>;
  if (!proposalId || !proposal || proposal.author_id !== userId || ["CONSENSUS_READY", "CONSENSUS_COMPLETED", "COMPLETED"].includes(proposal.status)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <ProposalForm proposal={proposal} onSubmitted={onSubmitted} />;
}

function ProposalInfoRoute() {
  const { proposalId } = useParams();
  const [proposal, setProposal] = useState<{ title: string; content: string; deadline: string } | null | undefined>(null);

  useEffect(() => {
    if (!proposalId) return;
    let cancelled = false;
    getProposal(proposalId)
      .then((item) => {
        if (cancelled) return;
        setProposal({
          title: item.title,
          content: item.content ?? "등록된 제안 내용이 없습니다.",
          deadline: item.deadline,
        });
      })
      .catch(() => {
        if (!cancelled) setProposal(undefined);
      });
    return () => { cancelled = true; };
  }, [proposalId]);

  if (proposal === null) return <p className="py-16 text-center text-sm text-ink-dim">불러오는 중...</p>;
  if (!proposal) return <Navigate to="/dashboard" replace />;
  return <ProposalInfoPage {...proposal} />;
}

function ProposalOpinionsRoute({ user }: Pick<Props, "user">) {
  const { proposalId } = useParams();
  const [proposal, setProposal] = useState<{ id: string; title: string; content: string; targetTeamId: string; teamMemberCount: number } | null | undefined>(null);

  useEffect(() => {
    let cancelled = false;

    if (!proposalId) return;

    getProposal(proposalId)
      .then(async (item) => {
        if (cancelled) return;
        const members = await getTeamMembers(item.target_team_id).catch(() => []);
        if (cancelled) return;
        setProposal({
          id: item.id,
          title: item.title,
          content: item.content ?? "제안 내용을 확인하고 의견을 남겨주세요.",
          targetTeamId: item.target_team_id,
          teamMemberCount: Math.max(1, members.length),
        });
      })
      .catch(() => {
        if (!cancelled) setProposal(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [proposalId]);

  if (!proposalId) return <Navigate to="/dashboard" replace />;
  if (proposal === null) {
    return <p className="py-16 text-center text-sm text-ink-dim">불러오는 중...</p>;
  }
  if (!proposal) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ConsensusDevPage
      proposalId={proposal.id}
      proposalTitle={proposal.title}
      proposalDescription={proposal.content}
      targetTeamId={proposal.targetTeamId}
      teamMemberCount={proposal.teamMemberCount}
      currentUser={{
        id: user.id,
        name: user.name,
        company: "Meridian",
        country: user.country,
        culturalRegion: user.culture_tag,
      }}
    />
  );
}

export default function ProposalPage({ user, onBackToDashboard, onOpenProfile, onLogout }: Props) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isFriendManagerOpen, setIsFriendManagerOpen] = useState(false);
  const [chatFriend, setChatFriend] = useState<FriendSummary | null>(null);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const { teams, selectedTeamId, isLoading: isLoadingTeams, selectTeam, createGroup, renameTeam } = useTeamSwitcher(user);
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? null;

  useEffect(() => {
    let cancelled = false;
    getNotifications().then((list) => {
      if (!cancelled) setNotifications(list);
    });
    return () => { cancelled = true; };
  }, []);

  const markAllRead = () => {
    const unreadIds = notifications.filter((notification) => !notification.is_read).map((notification) => notification.id);
    setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
    unreadIds.forEach((id) => markNotificationRead(id));
  };

  const markRead = (notification: Notification) => {
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
    markNotificationRead(notification.id);
  };

  const selectNotification = (notification: Notification) => {
    markRead(notification);
    if (notification.type === "FRIEND_REQUEST") {
      setIsFriendManagerOpen(true);
    } else if (notification.proposal_id) {
      navigate(`/proposals/${notification.proposal_id}/opinions`);
    }
  };

  const handleBack = () => {
    onBackToDashboard();
  };

  return (
    <div className="min-h-screen bg-void">
      <header className="sticky top-0 z-30 border-b border-surface-3 bg-void/80 backdrop-blur">
        <div className="flex w-full items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <BrandMark />
            <button
              type="button"
              onClick={onBackToDashboard}
              className="font-display text-lg text-ink"
            >
              Meridian
            </button>
          </div>

          <div className="flex items-center gap-3">
            <NotificationPanel notifications={notifications} onMarkAllRead={markAllRead} onMarkRead={markRead} onSelect={selectNotification} />
            <ConnectionButton onClick={() => setIsFriendManagerOpen(true)} />
            <div className="flex items-center gap-2 border-l border-surface-3 pl-3">
              <UserHandleButton user={user} onOpenProfile={onOpenProfile} onLogout={onLogout} />
            </div>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-65px)] w-full lg:grid-cols-[18%_82%]">
        <div className="hidden h-full border-r border-surface-3 px-4 lg:block">
          <WorkspaceSidebar
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
        <div className="relative min-w-0 px-4 sm:px-6 2xl:px-8">
          <button
            type="button"
            onClick={handleBack}
            aria-label="이전 화면"
            title="이전 화면"
            className="absolute left-2 top-3 z-10 flex h-5 w-5 items-center justify-center text-ink-dim transition hover:text-ink"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <Routes>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="new" element={<ProposalFormRoute teamId={selectedTeamId} onSubmitted={onBackToDashboard} />} />
            <Route path=":proposalId/edit" element={<ProposalEditRoute userId={user.id} onSubmitted={onBackToDashboard} />} />
            <Route path=":proposalId/detail" element={<ProposalInfoRoute />} />
            <Route path=":proposalId/opinions" element={<ProposalOpinionsRoute user={user} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
      <FriendManagerModal open={isFriendManagerOpen} onClose={() => setIsFriendManagerOpen(false)} currentUserId={user.id} teamId={selectedTeamId} onOpenChat={setChatFriend} />
      <TeamManagerModal open={isTeamManagerOpen} onClose={() => setIsTeamManagerOpen(false)} user={user} team={selectedTeam} onRenameTeam={renameTeam} />
    </div>
  );
}
