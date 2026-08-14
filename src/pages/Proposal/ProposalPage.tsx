import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import ProposalForm from "./ProposalForm";
import ProposalList from "./ProposalList";
import ProposalDetail from "./ProposalDetail";
import ConsensusDevPage from "../consensus/ConsensusDevPage";
import { getMockProposalById } from "../../mocks/proposalList";
import type { AuthUser } from "../../types";
import type { Proposal } from "../../types/proposal";

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
  const navigate = useNavigate();

  return (
    <div>
      <div className="max-w-[640px] mx-auto px-5 pt-6">
        <button
          type="button"
          onClick={() => navigate("/proposals")}
          className="text-sm text-ink-dim hover:text-ink"
        >
          ← 제안 목록
        </button>
      </div>
      <ProposalForm />
    </div>
  );
}

function ProposalDetailRoute() {
  const navigate = useNavigate();
  const { proposalId } = useParams();

  if (!proposalId) return <Navigate to="/proposals" replace />;

  return (
    <ProposalDetail
      proposalId={proposalId}
      onBack={() => navigate("/proposals")}
      onOpenOpinions={() => navigate(`/proposals/${proposalId}/opinions`)}
    />
  );
}

function ProposalOpinionsRoute({ user }: Pick<Props, "user">) {
  const navigate = useNavigate();
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
      onBack={() => navigate(`/proposals/${proposal.id}`)}
    />
  );
}

export default function ProposalPage({ user, onBackToDashboard, onOpenProfile, onLogout }: Props) {
  return (
    <div className="min-h-screen bg-void">
      <header className="sticky top-0 z-30 border-b border-surface-3 bg-void/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="font-display text-lg text-ink"
          >
            Meridian
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="rounded-full border border-surface-3 px-3 py-1.5 text-xs text-ink-dim transition-colors hover:text-ink"
            >
              대시보드
            </button>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-day text-[10px] font-semibold text-void"
              aria-hidden="true"
            >
              {user.name.slice(0, 1)}
            </span>
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

      <Routes>
        <Route index element={<ProposalListRoute />} />
        <Route path="new" element={<ProposalFormRoute />} />
        <Route path=":proposalId" element={<ProposalDetailRoute />} />
        <Route path=":proposalId/opinions" element={<ProposalOpinionsRoute user={user} />} />
        <Route path="*" element={<Navigate to="/proposals" replace />} />
      </Routes>
    </div>
  );
}
