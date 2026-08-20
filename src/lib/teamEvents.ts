import { useEffect, useRef } from "react";
import { auth } from "./firebase";

const RECONNECT_DELAY_MS = 3000;

/**
 * 백엔드 WebSocketConfig(/ws/team-events)에 연결해, 같은 팀에서 제안/의견이
 * 생성·수정·삭제될 때마다 onEvent를 호출한다. 이벤트 종류는 구분하지 않고
 * "다시 조회가 필요하다"는 신호로만 쓴다 — 호출부에서 목록을 refetch하면 된다.
 */
export function useTeamEvents(teamId: string | null, onEvent: () => void) {
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!teamId) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let cancelled = false;

    const connect = async () => {
      if (cancelled) return;
      await auth.authStateReady();
      const token = await auth.currentUser?.getIdToken();
      if (!token || cancelled) return;

      const base = import.meta.env.VITE_API_BASE_URL.replace(/^http/, "ws");
      socket = new WebSocket(`${base}/ws/team-events?token=${encodeURIComponent(token)}&teamId=${teamId}`);
      socket.onmessage = () => onEventRef.current();
      socket.onclose = () => {
        if (!cancelled) reconnectTimer = window.setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return () => {
      cancelled = true;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [teamId]);
}
