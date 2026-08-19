import { useState } from "react";
import { useParams } from "react-router-dom";
import type { AuthUser } from "../../../types";
import { findGroupByInviteCode, joinGroup } from "../workspaceStorage";

interface GroupInvitePageProps {
  user: AuthUser;
  onComplete: () => void;
}

export default function GroupInvitePage({ user, onComplete }: GroupInvitePageProps) {
  const { inviteCode = "" } = useParams();
  const [group, setGroup] = useState(() => findGroupByInviteCode(inviteCode));
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    const updated = joinGroup(inviteCode);
    if (!updated) return;
    setGroup(updated);
    setJoined(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-void px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-7 text-center shadow-panel">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-night/15 text-night">M</div>
        {group ? (
          <>
            <p className="text-xs text-ink-faint">{user.name}님을 그룹에 초대했어요</p>
            <h1 className="mt-2 font-display text-2xl text-ink">{group.name}</h1>
            <p className="mt-2 text-sm text-ink-dim">현재 {group.memberCount}명이 함께하고 있습니다.</p>
            {joined ? (
              <button type="button" onClick={onComplete} className="mt-6 w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-void">대시보드로 이동</button>
            ) : (
              <button type="button" onClick={handleJoin} className="mt-6 w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-void">그룹 참여하기</button>
            )}
          </>
        ) : (
          <>
            <h1 className="font-display text-xl text-ink">유효하지 않은 초대 링크예요</h1>
            <p className="mt-2 text-sm text-ink-dim">링크를 다시 확인하거나 그룹 관리자에게 문의해주세요.</p>
            <button type="button" onClick={onComplete} className="mt-6 rounded-full border border-surface-3 px-4 py-2 text-xs text-ink-dim hover:text-ink">대시보드로 돌아가기</button>
          </>
        )}
      </section>
    </main>
  );
}
