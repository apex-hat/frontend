import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import ProposalForm from "./ProposalForm";
import ProposalInfoPage from "./ProposalInfoPage";
import ConsensusDevPage from "../consensus/ConsensusDevPage";
import { getMockProposalById } from "../../mocks/proposalList";
import { isMySubmittedProposal, loadSubmittedProposals } from "../../mocks/proposal";
import { getNotifications, getProposals, markNotificationRead } from "../../lib/api";
import type { AuthUser, Notification } from "../../types";
import WorkspaceSidebar from "../../features/workspace/components/WorkspaceSidebar";
import UserHandleButton from "../../features/workspace/components/UserHandleButton";
import FriendManagerModal from "../../features/workspace/components/FriendManagerModal";
import NotificationPanel from "../../features/dashboard/components/NotificationPanel";
import { MOCK_PROPOSAL_CONTENT } from "../../features/dashboard/data/mockData";
import BrandMark from "../../components/branding/BrandMark";
import ConnectionButton from "../../features/workspace/components/ConnectionButton";

interface Props {
  user: AuthUser;
  onBackToDashboard: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

function ProposalFormRoute({ userId, onSubmitted }: { userId: string; onSubmitted: () => void }) {
  return <ProposalForm userId={userId} onSubmitted={onSubmitted} />;
}

function ProposalEditRoute({ userId, onSubmitted }: { userId: string; onSubmitted: () => void }) {
  const { proposalId } = useParams();
  const proposal = loadSubmittedProposals().find((item) => item.id === proposalId);
  if (!proposalId || !proposal || !isMySubmittedProposal(proposalId, userId)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <ProposalForm userId={userId} proposal={proposal} onSubmitted={onSubmitted} />;
}

function ProposalInfoRoute() {
  const { proposalId } = useParams();
  const [proposal, setProposal] = useState<{ title: string; content: string; deadline: string } | null | undefined>(null);

  useEffect(() => {
    if (!proposalId) return;
    let cancelled = false;
    getProposals().then((proposals) => {
      if (cancelled) return;
      const item = proposals.find((candidate) => candidate.id === proposalId);
      const submitted = loadSubmittedProposals().find((candidate) => candidate.id === proposalId);
      setProposal(item ? {
        title: item.title,
        content: submitted?.content ?? MOCK_PROPOSAL_CONTENT[item.id] ?? "등록된 제안 내용이 없습니다.",
        deadline: item.deadline,
      } : undefined);
    });
    return () => { cancelled = true; };
  }, [proposalId]);

  if (proposal === null) return <p className="py-16 text-center text-sm text-ink-dim">불러오는 중...</p>;
  if (!proposal) return <Navigate to="/dashboard" replace />;
  return <ProposalInfoPage {...proposal} />;
}

function ProposalOpinionsRoute({ user }: Pick<Props, "user">) {
  const { proposalId } = useParams();
  const [proposal, setProposal] = useState<{ id: string; title: string; content: string } | null | undefined>(null);

  useEffect(() => {
    let cancelled = false;

    if (!proposalId) return;

    Promise.all([getMockProposalById(proposalId), getProposals()]).then(([legacyProposal, dashboardProposals]) => {
      if (cancelled) return;
      if (legacyProposal) {
        setProposal(legacyProposal);
        return;
      }

      const dashboardProposal = dashboardProposals.find((item) => item.id === proposalId);
      const submittedProposal = loadSubmittedProposals().find((item) => item.id === proposalId);
      setProposal(dashboardProposal ? {
        id: dashboardProposal.id,
        title: dashboardProposal.title,
        content: submittedProposal?.content ?? MOCK_PROPOSAL_CONTENT[dashboardProposal.id] ?? "제안 내용을 확인하고 의견을 남겨주세요.",
      } : undefined);
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
          <WorkspaceSidebar user={user} />
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
            <Route path="new" element={<ProposalFormRoute userId={user.id} onSubmitted={onBackToDashboard} />} />
            <Route path=":proposalId/edit" element={<ProposalEditRoute userId={user.id} onSubmitted={onBackToDashboard} />} />
            <Route path=":proposalId/detail" element={<ProposalInfoRoute />} />
            <Route path=":proposalId/opinions" element={<ProposalOpinionsRoute user={user} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
      <FriendManagerModal open={isFriendManagerOpen} onClose={() => setIsFriendManagerOpen(false)} />
    </div>
  );
}
