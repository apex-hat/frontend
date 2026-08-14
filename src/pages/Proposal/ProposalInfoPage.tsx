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
    <main className="mx-auto w-full max-w-[640px] space-y-5 px-6 py-10 text-ink">
      <section>
        <h1 className="mb-2 text-xs font-semibold text-ink-dim">제목</h1>
        <p className="rounded-xl border border-surface-3 bg-surface px-4 py-3 text-sm leading-6 text-ink">{title}</p>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold text-ink-dim">내용</h2>
        <p className="min-h-24 rounded-xl border border-surface-3 bg-surface px-4 py-3 text-sm leading-7 text-ink-dim">{content}</p>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold text-ink-dim">기한</h2>
        <p className="rounded-xl border border-surface-3 bg-surface px-4 py-3 text-sm text-ink">{deadlineLabel}</p>
      </section>
    </main>
  );
}
