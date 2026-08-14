interface ProposalInfoPageProps {
  title: string;
  content: string;
  deadline: string;
  targetGroup?: string;
}

export default function ProposalInfoPage({ title, content, deadline, targetGroup }: ProposalInfoPageProps) {
  const deadlineLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(deadline));

  return (
    <main className="mx-auto w-full max-w-[720px] px-6 py-10 text-ink">
      <header className="border-b border-surface-3 pb-6">
        <p className="mb-2 text-[11px] font-medium text-ink-faint">제안 상세 정보</p>
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.03em] text-ink">{title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-dim">
          {targetGroup && <span>{targetGroup}</span>}
          <span>마감 {deadlineLabel}</span>
        </div>
      </header>

      <section className="pt-7">
        <h2 className="mb-3 text-xs font-semibold text-ink-dim">제안 내용</h2>
        <p className="rounded-xl border border-surface-3 bg-surface px-4 py-4 text-sm leading-7 text-ink-dim">
          {content}
        </p>
      </section>
    </main>
  );
}
