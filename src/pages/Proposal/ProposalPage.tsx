import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import ProposalForm from "./ProposalForm";
import ProposalList from "./ProposalList";
import ProposalDetail from "./ProposalDetail";
import ConsensusDevPage from "../consensus/ConsensusDevPage";
import { getMockProposalById } from "../../mocks/proposalList";
import type { AuthUser } from "../../types";
import type { Proposal } from "../../types/proposal";
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
    if (location.pathname === "/proposals/new") {
      onBackToDashboard();
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
        <div className="flex w-full items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="font-display text-lg text-ink"
            >
              Meridian
            </button>
          </div>

          <div className="flex items-center gap-2">
            <UserHandleButton user={user} onOpenProfile={onOpenProfile} onLogout={onLogout} />
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
            <Route index element={<ProposalListRoute />} />
            <Route path="new" element={<ProposalFormRoute />} />
            <Route path=":proposalId" element={<ProposalDetailRoute />} />
            <Route path=":proposalId/opinions" element={<ProposalOpinionsRoute user={user} />} />
            <Route path="*" element={<Navigate to="/proposals" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
