import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import ProposalForm from "./ProposalForm";
import ProposalList from "./ProposalList";
import ProposalDetail from "./ProposalDetail";
import ConsensusDevPage from "../consensus/ConsensusDevPage";
import { getMockProposalById } from "../../mocks/proposalList";
import type { AuthUser } from "../../types";
import type { Proposal } from "../../types/proposal";
import BackButton from "../../components/navigation/BackButton";
import WorkspaceSidebar from "../../features/workspace/components/WorkspaceSidebar";
import UserHandleButton from "../../features/workspace/components/UserHandleButton";

interface Props {
  user: AuthUser;
  onBackToDashboard: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

function ProposalListRoute() {
  const navigate = useNavigate();

  return (
    <ProposalList
      onSelect={(id) => navigate(`/proposals/${id}`)}
      onCreateNew={() => navigate("/proposals/new")}
    />
  );
}

function ProposalFormRoute() {
  return <ProposalForm />;
}

function ProposalDetailRoute() {
  const navigate = useNavigate();
  const { proposalId } = useParams();

  if (!proposalId) return <Navigate to="/proposals" replace />;

  return (
    <ProposalDetail
      proposalId={proposalId}
      onOpenOpinions={() => navigate(`/proposals/${proposalId}/opinions`)}
    />
  );
}

function ProposalOpinionsRoute({ user }: Pick<Props, "user">) {
  const { proposalId } = useParams();
  const [proposal, setProposal] = useState<Proposal | null | undefined>(null);

  useEffect(() => {
    let cancelled = false;

    if (!proposalId) return;

    getMockProposalById(proposalId).then((result) => {
      if (!cancelled) setProposal(result ?? undefined);
    });

    return () => {
      cancelled = true;
    };
  }, [proposalId]);

  if (!proposalId) return <Navigate to="/proposals" replace />;
  if (proposal === null) {
    return <p className="py-16 text-center text-sm text-ink-dim">불러오는 중...</p>;
  }
  if (!proposal) {
    return <Navigate to="/proposals" replace />;
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
  const location = useLocation();

  const handleBack = () => {
    if (location.pathname.endsWith("/opinions")) {
      navigate(location.pathname.replace(/\/opinions$/, ""));
      return;
    }
    if (location.pathname !== "/proposals") {
      navigate("/proposals");
      return;
    }
    onBackToDashboard();
  };

  return (
    <div className="min-h-screen bg-void">
      <header className="sticky top-0 z-30 border-b border-surface-3 bg-void/80 backdrop-blur">
        <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <BackButton onClick={handleBack} />
            <button
              type="button"
              onClick={onBackToDashboard}
              className="font-display text-lg text-ink"
            >
              Meridian
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-day text-[10px] font-semibold text-void"
              aria-hidden="true"
            >
              {user.name.slice(0, 1)}
            </span>
            <UserHandleButton user={user} />
            <button
              type="button"
              onClick={onOpenProfile}
              className="rounded-full border border-surface-3 px-3 py-1.5 text-xs text-ink-dim transition-colors hover:text-ink"
            >
              내정보
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-surface-3 px-3 py-1.5 text-xs text-ink-dim transition-colors hover:text-ink"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="grid w-full lg:grid-cols-[18%_64%_18%]">
        <div className="hidden min-h-[calc(100vh-65px)] border-r border-surface-3 px-4 py-8 lg:block 2xl:px-8">
          <WorkspaceSidebar user={user} mode="messages" />
        </div>
        <div className="min-w-0 px-4 sm:px-6 2xl:px-8">
          <Routes>
            <Route index element={<ProposalListRoute />} />
            <Route path="new" element={<ProposalFormRoute />} />
            <Route path=":proposalId" element={<ProposalDetailRoute />} />
            <Route path=":proposalId/opinions" element={<ProposalOpinionsRoute user={user} />} />
            <Route path="*" element={<Navigate to="/proposals" replace />} />
          </Routes>
        </div>
        <div className="hidden min-h-[calc(100vh-65px)] border-l border-surface-3 px-4 py-8 lg:block 2xl:px-8">
          <WorkspaceSidebar user={user} mode="groups" />
        </div>
      </div>
    </div>
  );
}
