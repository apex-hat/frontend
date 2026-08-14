interface ProposalInfoPageProps {
  title: string;
  content: string;
  deadline: string;
}

export default function ProposalInfoPage({ title, content, deadline }: ProposalInfoPageProps) {
  const deadlineLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(deadline));

  return (
    <main className="mx-auto w-full max-w-[680px] px-6 py-12 text-ink">
      <header className="pb-8">
        <h1 className="font-display text-[32px] font-semibold leading-[1.28] tracking-[-0.035em] text-ink sm:text-[38px]">{title}</h1>
      </header>

      <section className="border-t border-surface-3 py-7">
        <h2 className="mb-3 text-[11px] font-semibold text-ink-faint">내용</h2>
        <p className="whitespace-pre-wrap text-[14px] leading-7 text-ink-dim">{content}</p>
      </section>

      <section className="border-t border-surface-3 pt-6">
        <h2 className="mb-3 text-[11px] font-semibold text-ink-faint">기한</h2>
        <div className="flex items-center gap-2 text-[13px] text-ink-dim">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
            <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
          </svg>
          <span>{deadlineLabel}</span>
        </div>
      </section>
    </main>
  );
}
