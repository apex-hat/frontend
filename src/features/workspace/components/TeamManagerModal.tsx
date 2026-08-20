import { useEffect, useState, type FormEvent } from "react";
import {
  cancelTeamInvite,
  getTeamActivityLog,
  getTeamMembers,
  getTeamSentInvites,
  removeTeamMember,
  resendTeamInvite,
  searchUserByFriendCode,
  sendTeamInvite,
  TeamError,
  TeamInviteError,
  transferTeamPm,
  type ActivityLogEntry,
  type TeamInviteSummary,
  type TeamMemberProfile,
  type UserSummary,
} from "../../../lib/api";
import type { AuthUser, Team } from "../../../types";

interface Props {
  open: boolean;
  onClose: () => void;
  user: AuthUser;
  team: Team | null;
  onMembersChanged?: () => void;
  onRenameTeam?: (teamId: string, name: string) => Promise<unknown>;
  onDeleteTeam?: (teamId: string) => Promise<unknown>;
  onLeaveTeam?: (teamId: string) => Promise<unknown>;
}

export default function TeamManagerModal({ open, onClose, user, team, onMembersChanged, onRenameTeam, onDeleteTeam, onLeaveTeam }: Props) {
  const [members, setMembers] = useState<TeamMemberProfile[]>([]);
  const [friendCode, setFriendCode] = useState("");
  const [foundUser, setFoundUser] = useState<UserSummary | null>(null);
  const [matchedFriendCode, setMatchedFriendCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [isLeavingTeam, setIsLeavingTeam] = useState(false);
  const [transferringToId, setTransferringToId] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<TeamInviteSummary[]>([]);
  const [inviteActionId, setInviteActionId] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

  const loadMembers = () => {
    if (!team) return;
    getTeamMembers(team.id).then(setMembers).catch(() => setStatus("팀원 목록을 불러오지 못했습니다."));
  };

  // 열려있는 동안 짧은 주기로 다시 조회한다(WebSocket 없이 폴링) — 그렇지 않으면 모달을
  // 띄워둔 채 다른 사람이 팀에 합류/이탈해도 다시 열기 전까지는 팀원 목록이 안 바뀌었다.
  useEffect(() => {
    if (!open || !team) return;
    loadMembers();
    getTeamActivityLog(team.id).then(setActivityLog).catch(() => {});
    const interval = window.setInterval(() => {
      loadMembers();
      getTeamActivityLog(team.id).then(setActivityLog).catch(() => {});
    }, 10_000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, team?.id]);

  const me = members.find((member) => member.user_id === user.id);
  const isPm = me?.role === "PM";

  useEffect(() => {
    if (!open || !team || !isPm) return;
    getTeamSentInvites(team.id).then(setSentInvites).catch(() => {});
    const interval = window.setInterval(() => {
      getTeamSentInvites(team.id).then(setSentInvites).catch(() => {});
    }, 10_000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, team?.id, isPm]);

  if (!open || !team) return null;

  /** 팀원이 나뿐이면 PM 권한을 넘길 대상 자체가 없어 나가기가 불가능하다 — 이 경우 삭제로 유도한다. */
  const isSoleMember = members.length <= 1;
  /**
   * Backend는 "총 팀원 수"가 아니라 "이 팀에 PM이 몇 명인지"로 나가기 가능 여부를 판단한다
   * (TeamService.leaveTeam: PM 역할 인원이 1명 이하일 때만 양도를 요구). 팀원이 여러 명이어도
   * 다른 PM이 이미 있으면 바로 나갈 수 있으므로, isSoleMember만으로는 이 조건을 판단할 수 없다.
   */
  const isOnlyPm = isPm && !members.some((member) => member.role === "PM" && member.user_id !== user.id);
  const pendingInvites = sentInvites.filter((invite) => invite.status === "PENDING");

  const startEditName = () => {
    setNameDraft(team.name);
    setIsEditingName(true);
  };

  const saveEditName = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === team.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      await onRenameTeam?.(team.id, trimmed);
      setIsEditingName(false);
    } catch {
      setStatus("팀명을 변경하지 못했습니다.");
    } finally {
      setIsSavingName(false);
    }
  };

  const search = async (event: FormEvent) => {
    event.preventDefault();
    const handle = friendCode.trim().toUpperCase().match(/#?MER-[A-Z0-9]{4,}/)?.[0];
    if (!handle) {
      setStatus("#MER-XXXX 형식으로 입력해주세요.");
      return;
    }
    setIsBusy(true);
    setFoundUser(null);
    setStatus(null);
    try {
      const result = await searchUserByFriendCode(handle);
      if (!result) setStatus("해당 고유 ID로 가입한 사용자가 없습니다.");
      else if (members.some((member) => member.user_id === result.id)) setStatus("이미 이 팀에 참여한 사용자입니다.");
      else {
        setFoundUser(result);
        setMatchedFriendCode(handle);
      }
    } catch {
      setStatus("사용자 검색에 실패했습니다.");
    } finally {
      setIsBusy(false);
    }
  };

  const invite = async () => {
    if (!foundUser) return;
    setIsBusy(true);
    try {
      await sendTeamInvite(team.id, matchedFriendCode);
      setStatus(`${foundUser.name}님에게 초대를 보냈습니다. 상대가 수락하면 팀원이 됩니다.`);
      setFoundUser(null);
      setFriendCode("");
    } catch (error) {
      setStatus(
        error instanceof TeamInviteError
          ? error.code === "TEAM_MEMBER_ALREADY_EXISTS" ? "이미 이 팀에 참여한 사용자입니다."
            : error.code === "TEAM_INVITE_EXISTS" ? "이미 초대를 보낸 사용자입니다."
              : "초대에 실패했습니다. PM 권한을 확인해주세요."
          : "초대에 실패했습니다. PM 권한을 확인해주세요.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const cancelInvite = async (invite: TeamInviteSummary) => {
    if (!window.confirm(`${invite.invitedUserName}님에게 보낸 초대를 취소할까요?`)) return;
    setInviteActionId(invite.id);
    try {
      await cancelTeamInvite(team.id, invite.id);
      setSentInvites((current) => current.filter((item) => item.id !== invite.id));
      setStatus(`${invite.invitedUserName}님에게 보낸 초대를 취소했습니다.`);
    } catch {
      setStatus("초대를 취소하지 못했습니다.");
    } finally {
      setInviteActionId(null);
    }
  };

  const resendInvite = async (invite: TeamInviteSummary) => {
    setInviteActionId(invite.id);
    try {
      await resendTeamInvite(team.id, invite.id);
      setStatus(`${invite.invitedUserName}님에게 초대를 다시 보냈습니다.`);
    } catch {
      setStatus("초대를 다시 보내지 못했습니다.");
    } finally {
      setInviteActionId(null);
    }
  };

  const remove = async (member: TeamMemberProfile) => {
    if (!window.confirm(`${member.name}님을 팀에서 내보낼까요?`)) return;
    setIsBusy(true);
    try {
      await removeTeamMember(team.id, member.user_id);
      setMembers((current) => current.filter((item) => item.user_id !== member.user_id));
      setStatus(`${member.name}님을 팀에서 내보냈습니다.`);
      onMembersChanged?.();
    } catch {
      setStatus("팀원을 내보내지 못했습니다.");
    } finally {
      setIsBusy(false);
    }
  };

  const transferPm = async (member: TeamMemberProfile) => {
    if (!window.confirm(`PM 권한을 ${member.name}님에게 넘길까요?\n본인은 일반 팀원(MEMBER)이 됩니다.`)) return;
    setTransferringToId(member.user_id);
    try {
      await transferTeamPm(team.id, member.user_id);
      setStatus(`${member.name}님에게 PM 권한을 넘겼습니다.`);
      loadMembers();
      onMembersChanged?.();
    } catch {
      setStatus("PM 권한을 넘기지 못했습니다.");
    } finally {
      setTransferringToId(null);
    }
  };

  const leave = async () => {
    if (!window.confirm(`"${team.name}" 팀에서 나갈까요?`)) return;
    setIsLeavingTeam(true);
    try {
      await onLeaveTeam?.(team.id);
      onClose();
    } catch (error) {
      setStatus(
        error instanceof TeamError && error.code === "TEAM_PM_MUST_TRANSFER_FIRST"
          ? "PM은 먼저 다른 팀원에게 PM 권한을 넘긴 뒤 나갈 수 있습니다."
          : "팀을 나가지 못했습니다.",
      );
    } finally {
      setIsLeavingTeam(false);
    }
  };

  const removeTeam = async () => {
    if (!window.confirm(`"${team.name}" 팀을 삭제할까요?\n팀의 모든 제안, 의견, 메시지가 함께 영구 삭제되며 되돌릴 수 없습니다.`)) return;
    setIsDeletingTeam(true);
    try {
      await onDeleteTeam?.(team.id);
      onClose();
    } catch {
      setStatus("팀을 삭제하지 못했습니다.");
    } finally {
      setIsDeletingTeam(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="team-manager-title" className="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-6 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] text-ink-faint">팀 관리</p>
            {isEditingName ? (
              <form onSubmit={saveEditName} className="mt-1 flex items-center gap-1.5">
                <input
                  id="team-manager-title"
                  autoFocus
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  onBlur={saveEditName}
                  onKeyDown={(event) => { if (event.key === "Escape") setIsEditingName(false); }}
                  disabled={isSavingName}
                  aria-label="팀명 수정"
                  className="min-w-0 flex-1 rounded-md border border-surface-3 bg-surface-2 px-2 py-1 font-display text-xl text-ink outline-none focus:border-night"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={isPm ? startEditName : undefined}
                disabled={!isPm}
                title={isPm ? "팀명 수정" : undefined}
                className="group mt-1 flex items-center gap-1.5 disabled:cursor-default"
              >
                <h2 id="team-manager-title" className="truncate font-display text-xl text-ink">{team.name}</h2>
                {isPm && (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-transparent text-ink-faint opacity-0 transition group-hover:border-surface-3 group-hover:text-ink-dim group-hover:opacity-100">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </span>
                )}
              </button>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="text-lg text-ink-dim hover:text-ink">×</button>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-ink">팀원</p><span className="text-[10px] text-ink-faint">{members.length}명</span></div>
          <div className="max-h-48 divide-y divide-surface-3 overflow-y-auto rounded-xl border border-surface-3 px-3">
            {members.map((member) => (
              <div key={member.user_id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1"><p className="truncate text-xs text-ink">{member.name}{member.user_id === user.id ? " (나)" : ""}</p><p className="truncate text-[9px] text-ink-faint">{member.email}</p></div>
                <span className="text-[9px] text-ink-faint">{member.role}</span>
                {isPm && member.user_id !== user.id && (
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={transferringToId !== null} onClick={() => transferPm(member)} className="text-[10px] text-ink-faint hover:text-ink">
                      {transferringToId === member.user_id ? "양도 중…" : "PM 양도"}
                    </button>
                    <button type="button" disabled={isBusy} onClick={() => remove(member)} className="text-[10px] text-ink-faint hover:text-alert">내보내기</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 border-t border-surface-3 pt-5">
          <p className="text-xs font-semibold text-ink">팀원 초대</p>
          {isPm ? (
            <>
              <p className="mt-1 text-[10px] leading-4 text-ink-faint">상대의 고유 ID(#MER-XXXX)로 초대를 보내면, 상대가 수락해야 팀원이 됩니다.</p>
              <form onSubmit={search} className="mt-3 flex gap-2"><input value={friendCode} onChange={(event) => { setFriendCode(event.target.value); setFoundUser(null); }} placeholder="#MER-XXXX" className="min-w-0 flex-1 rounded-lg border border-surface-3 bg-surface-2 px-3 py-2 font-mono text-xs uppercase text-ink outline-none focus:border-night" /><button disabled={isBusy} className="rounded-lg bg-ink px-4 text-xs font-semibold text-void disabled:opacity-50">검색</button></form>
              {foundUser && <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface-2 p-3"><div className="min-w-0 flex-1"><p className="text-xs text-ink">{foundUser.name}</p><p className="truncate text-[9px] text-ink-faint">{foundUser.email}</p></div><button type="button" onClick={invite} disabled={isBusy} className="rounded-md border border-surface-3 px-3 py-1.5 text-xs text-ink-dim hover:text-ink">초대</button></div>}
            </>
          ) : <p className="mt-2 text-[10px] text-ink-faint">PM만 팀원을 초대하거나 내보낼 수 있습니다.</p>}

          {isPm && pendingInvites.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-medium text-ink-faint">대기 중인 초대 {pendingInvites.length}건</p>
              <div className="mt-2 max-h-32 divide-y divide-surface-3 overflow-y-auto rounded-xl border border-surface-3 px-3">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="flex items-center gap-3 py-2.5">
                    <p className="min-w-0 flex-1 truncate text-xs text-ink">{invite.invitedUserName}</p>
                    <button
                      type="button"
                      disabled={inviteActionId !== null}
                      onClick={() => resendInvite(invite)}
                      className="text-[10px] text-ink-faint hover:text-ink"
                    >
                      {inviteActionId === invite.id ? "처리 중…" : "다시 보내기"}
                    </button>
                    <button
                      type="button"
                      disabled={inviteActionId !== null}
                      onClick={() => cancelInvite(invite)}
                      className="text-[10px] text-ink-faint hover:text-alert"
                    >
                      취소
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-surface-3 pt-5">
          <p className="text-xs font-semibold text-ink">팀 나가기</p>
          <p className="mt-1 text-[10px] leading-4 text-ink-faint">
            {isPm && isSoleMember
              ? "혼자 남은 팀이라 나갈 대상이 없습니다. 팀을 정리하려면 아래 위험 구역에서 팀을 삭제하세요."
              : isOnlyPm
                ? "PM은 다른 팀원에게 PM 권한을 먼저 넘긴 뒤에만 나갈 수 있습니다."
                : "이 팀에서 나가면 더 이상 팀의 제안과 대화를 볼 수 없습니다."}
          </p>
          <button
            type="button"
            onClick={leave}
            disabled={isLeavingTeam || isOnlyPm}
            className="mt-3 rounded-lg border border-surface-3 px-4 py-2 text-xs font-semibold text-ink-dim transition hover:bg-surface-2 hover:text-ink disabled:opacity-50"
          >
            {isLeavingTeam ? "나가는 중…" : "팀 나가기"}
          </button>
        </div>

        {activityLog.length > 0 && (
          <div className="mt-5 border-t border-surface-3 pt-5">
            <p className="text-xs font-semibold text-ink">최근 활동</p>
            <p className="mt-1 text-[10px] leading-4 text-ink-faint">팀원 내보내기, PM 양도, PM의 의견 모더레이션 등 팀에 영향을 주는 활동 기록입니다.</p>
            <div className="mt-2 max-h-40 divide-y divide-surface-3 overflow-y-auto rounded-xl border border-surface-3 px-3">
              {activityLog.map((entry) => (
                <div key={entry.id} className="py-2.5">
                  <p className="text-xs text-ink">{entry.description}</p>
                  <p className="mt-0.5 text-[9px] text-ink-faint">{new Date(entry.createdAt).toLocaleString("ko-KR")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isPm && (
          <div className="mt-5 border-t border-surface-3 pt-5">
            <p className="text-xs font-semibold text-alert">위험 구역</p>
            <p className="mt-1 text-[10px] leading-4 text-ink-faint">팀을 삭제하면 이 팀의 제안, 의견, 메시지가 모두 영구 삭제됩니다. 되돌릴 수 없습니다.</p>
            <button
              type="button"
              onClick={removeTeam}
              disabled={isDeletingTeam}
              className="mt-3 rounded-lg border border-alert/40 px-4 py-2 text-xs font-semibold text-alert transition hover:bg-alert/10 disabled:opacity-50"
            >
              {isDeletingTeam ? "삭제하는 중…" : "팀 삭제하기"}
            </button>
          </div>
        )}

        {status && <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-ink-dim">{status}</p>}
      </section>
    </div>
  );
}
