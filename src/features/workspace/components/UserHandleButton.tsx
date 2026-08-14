import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "../../../types";
import { getUserHandle } from "../workspaceStorage";

interface UserHandleButtonProps {
  user: AuthUser;
  onOpenProfile?: () => void;
  onLogout?: () => void;
}

export default function UserHandleButton({ user, onOpenProfile, onLogout }: UserHandleButtonProps) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const handle = getUserHandle(user);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setMenu(null);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  const copyHandle = async () => {
    try {
      await navigator.clipboard.writeText(`${user.name} ${handle}`);
    } finally {
      setMenu(null);
    }
  };

  return (
    <div ref={ref}>
      <button
        type="button"
        aria-label={`${user.name} 프로필 메뉴`}
        title="우클릭하여 내 태그 관리"
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
          className="fixed z-50 w-28 overflow-hidden rounded-lg border border-surface-3 bg-surface-2 py-1 shadow-panel"
          style={{ left: Math.min(menu.x, window.innerWidth - 125), top: Math.min(menu.y, window.innerHeight - 70) }}
        >
          <button type="button" onClick={() => void copyHandle()} className="w-full px-3 py-2 text-left text-xs text-ink-dim hover:bg-surface-3 hover:text-ink">
            내 태그 복사
          </button>
          {onOpenProfile && (
            <button type="button" onClick={() => { setMenu(null); onOpenProfile(); }} className="w-full px-3 py-2 text-left text-xs text-ink-dim hover:bg-surface-3 hover:text-ink">
              내정보
            </button>
          )}
          {onLogout && (
            <>
              <div className="my-1 border-t border-surface-3" />
              <button type="button" onClick={() => { setMenu(null); onLogout(); }} className="w-full px-3 py-2 text-left text-xs text-ink-dim hover:bg-surface-3 hover:text-ink">
                로그아웃
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
