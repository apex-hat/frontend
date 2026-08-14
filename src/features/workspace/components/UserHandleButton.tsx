import { useState } from "react";
import type { AuthUser } from "../../../types";
import { getUserHandle } from "../workspaceStorage";

export default function UserHandleButton({ user }: { user: AuthUser }) {
  const [copied, setCopied] = useState(false);
  const handle = getUserHandle(user);

  const copyHandle = async () => {
    try {
      await navigator.clipboard.writeText(handle);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copyHandle}
      title="내 고유 ID 복사"
      className="hidden rounded-full border border-surface-3 px-2.5 py-1.5 font-mono text-[9px] text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink sm:block"
    >
      {copied ? "복사됨" : handle}
    </button>
  );
}
