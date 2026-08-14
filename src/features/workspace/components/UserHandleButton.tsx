import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "../../../types";

interface UserHandleButtonProps {
  user: AuthUser;
  onOpenProfile?: () => void;
  onLogout?: () => void;
}

export default function UserHandleButton({ user, onOpenProfile, onLogout }: UserHandleButtonProps) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setMenu(null);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref}>
      <button
        type="button"
        aria-label={`${user.name} 프로필 메뉴`}
        title="우클릭하여 계정 메뉴 열기"
        onContextMenu={(event) => {
          event.preventDefault();
          setMenu({ x: event.clientX, y: event.clientY });
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-day text-[10px] font-semibold text-void"
      >
        {user.name.slice(0, 1)}
      </button>

      {menu && (
        <div
          className="fixed z-50 w-24 overflow-hidden rounded-lg border border-surface-3 bg-surface-2 py-1 shadow-panel"
          style={{ left: Math.min(menu.x, window.innerWidth - 125), top: Math.min(menu.y, window.innerHeight - 70) }}
        >
          {onOpenProfile && (
            <button type="button" onClick={() => { setMenu(null); onOpenProfile(); }} className="w-full px-3 py-2 text-left text-xs text-ink-dim hover:bg-surface-3 hover:text-ink">
              내정보
            </button>
          )}
          {onLogout && (
            <>
              <div className="my-1 border-t border-surface-3" />
              <button type="button" onClick={() => { setMenu(null); onLogout(); }} className="w-full px-3 py-2 text-left text-xs text-alert hover:bg-alert/10">
                로그아웃
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
