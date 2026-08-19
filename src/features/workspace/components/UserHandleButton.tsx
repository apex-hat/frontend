import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "../../../types";

interface UserHandleButtonProps {
  user: AuthUser;
  onOpenProfile?: () => void;
  onLogout?: () => void;
}

export default function UserHandleButton({ user, onOpenProfile, onLogout }: UserHandleButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`${user.name} 프로필 메뉴`}
        title="우클릭하여 계정 메뉴 열기"
        onClick={() => setMenuOpen((open) => !open)}
        onContextMenu={(event) => {
          event.preventDefault();
          setMenuOpen(true);
        }}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-day text-[10px] font-semibold text-void transition ${menuOpen ? "ring-2 ring-day/20" : "hover:opacity-90"}`}
      >
        {user.name.slice(0, 1)}
      </button>

      {menuOpen && (
        <div
          className="absolute right-0 top-[calc(100%+9px)] z-50 w-28 overflow-hidden rounded-xl border border-surface-3 bg-surface py-1.5 shadow-panel"
        >
          {onOpenProfile && (
            <button type="button" onClick={() => { setMenuOpen(false); onOpenProfile(); }} className="w-full px-3.5 py-2 text-left text-xs text-ink-dim transition hover:bg-surface-2 hover:text-ink">
              내정보
            </button>
          )}
          {onLogout && (
            <>
              <div className="mx-2 my-1 border-t border-surface-3" />
              <button type="button" onClick={() => { setMenuOpen(false); onLogout(); }} className="w-full px-3.5 py-2 text-left text-xs text-alert transition hover:bg-alert/10">
                로그아웃
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
