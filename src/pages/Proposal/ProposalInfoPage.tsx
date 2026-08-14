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
      <article className="overflow-hidden rounded-2xl border border-surface-3 bg-surface shadow-panel">
        <header className="px-7 pb-6 pt-7 sm:px-9 sm:pt-9">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-night">제목</p>
          <h1 className="font-display text-[26px] font-semibold leading-[1.32] tracking-[-0.03em] text-ink sm:text-[30px]">{title}</h1>
          <div className="mt-5 flex w-fit items-center gap-2 rounded-full border border-surface-3 bg-void/35 px-3 py-1.5 text-[11px] text-ink-dim">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
            </svg>
            <span>기한 {deadlineLabel}</span>
          </div>
        </header>

        <section className="border-t border-surface-3 px-7 py-7 sm:px-9 sm:py-8">
          <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">내용</h2>
          <p className="whitespace-pre-wrap text-[14px] leading-7 text-ink-dim">{content}</p>
        </section>
      </article>
    </main>
  );
}
