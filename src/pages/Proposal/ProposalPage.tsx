import { useState } from "react";
import ProposalForm from "./ProposalForm";
import ProposalList from "./ProposalList";
import ProposalDetail from "./ProposalDetail";

type View =
  | { name: "list" }
  | { name: "detail"; id: string }
  | { name: "form" };

// 임시 화면 전환기 (List ↔ Detail ↔ Form).
// 아직 공통 라우팅(react-router 등)이 안 붙어서 로컬 state로 화면을 바꾸는 구조로 만들어둠.
// 나중에 라우팅 붙으면 각 화면을 그대로 Route에 꽂고, 이 파일은 지워도 됨.
// (ProposalList/ProposalDetail/ProposalForm은 각자 독립된 컴포넌트라 그대로 재사용 가능)
export default function ProposalPage() {
  const [view, setView] = useState<View>({ name: "list" });

  if (view.name === "detail") {
    return (
      <ProposalDetail
        proposalId={view.id}
        onBack={() => setView({ name: "list" })}
      />
    );
  }

  if (view.name === "form") {
    return <ProposalForm />;
  }

  return (
    <ProposalList
      onSelect={(id) => setView({ name: "detail", id })}
      onCreateNew={() => setView({ name: "form" })}
    />
  );
}
