// 타임존 관련 계산 유틸. Intl API만 사용하므로 외부 라이브러리 의존성 없음.
// 백엔드 연동 시 이 파일의 함수 시그니처는 그대로 두고 내부 구현만
// 서버 계산 값으로 대체해도 되도록 설계했습니다.

/** 주어진 IANA 타임존의 "지금" Date 정보를 반환 */
export function getLocalTimeParts(timezone: string, now: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  });
  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  return { hour: hour % 24, minute, weekday };
}

/** "HH:MM" 형태의 표시용 문자열 */
export function formatLocalTime(timezone: string, now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

/** UTC 대비 오프셋을 "UTC+9" 같은 문자열로 반환 */
export function getUtcOffsetLabel(timezone: string, now: Date = new Date()) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  });
  const part = dtf.formatToParts(now).find((p) => p.type === "timeZoneName");
  return part?.value?.replace("GMT", "UTC") ?? "";
}

export type DayPhase = "deep_night" | "early_morning" | "day" | "evening" | "night";

/** 시간대를 5단계 컨디션으로 분류 (UI 색상/아이콘 결정용) */
export function getDayPhase(hour: number): DayPhase {
  if (hour >= 0 && hour < 5) return "deep_night";
  if (hour >= 5 && hour < 8) return "early_morning";
  if (hour >= 8 && hour < 19) return "day";
  if (hour >= 19 && hour < 23) return "evening";
  return "night"; // 23시대
}

/** 응답이 없는 팀원에 대해 "지금 새벽 3시라 응답 못했을 가능성" 같은 컨텍스트 문구 생성 */
export function getUnavailabilityHint(timezone: string, now: Date = new Date()): string | null {
  const { hour } = getLocalTimeParts(timezone, now);
  const phase = getDayPhase(hour);
  if (phase === "deep_night") {
    return `현지 시각 새벽 ${hour}시라 아직 확인하지 못했을 가능성이 커요`;
  }
  if (phase === "night" && hour >= 23) {
    return `현지 시각 밤 ${hour}시라 자고 있을 가능성이 있어요`;
  }
  if (phase === "early_morning") {
    return `현지 시각 오전 ${hour}시, 막 하루를 시작했을 시간이에요`;
  }
  return null;
}

/** 두 타임존 간 겹치는 업무시간(09~18시 기준) 대략적 존재 여부 */
export function hasWorkingHourOverlap(tzA: string, tzB: string, now: Date = new Date()) {
  const a = getLocalTimeParts(tzA, now).hour;
  const b = getLocalTimeParts(tzB, now).hour;
  const inWork = (h: number) => h >= 9 && h < 18;
  return inWork(a) && inWork(b);
}
