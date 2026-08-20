interface ConnectionButtonProps {
  onClick: () => void;
}

export default function ConnectionButton({ onClick }: ConnectionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="친구 추가 또는 팀원 추가"
      title="친구 추가 또는 팀원 추가"
      className="flex h-7 w-7 items-center justify-center text-ink-dim transition hover:text-ink"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 18.5c.5-3.4 2.3-5.2 5.5-5.2 1.5 0 2.7.4 3.6 1.2M17.5 8v7M14 11.5h7" />
      </svg>
    </button>
  );
}
