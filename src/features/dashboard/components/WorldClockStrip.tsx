import { useEffect, useState } from "react";
import type { TimezoneEntry } from "../../../lib/api";
import { formatLocalTime, getDayPhase, getLocalTimeParts, getUnavailabilityHint } from "../../../lib/timezone";

interface WorldClockStripProps {
  members: TimezoneEntry[];
  title?: string;
}

const PHASE_DOT: Record<string, string> = {
  deep_night: "bg-night",
  night: "bg-night-dim",
  early_morning: "bg-day-dim",
  day: "bg-day",
  evening: "bg-day-dim",
};

const HOUR_MARKS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

const TIMEZONE_LABELS: Record<string, string> = {
  "Asia/Seoul": "서울",
  "Asia/Tokyo": "도쿄",
  "Asia/Kolkata": "콜카타",
  "Asia/Singapore": "싱가포르",
  "Europe/London": "런던",
  "Europe/Berlin": "베를린",
  "Europe/Paris": "파리",
  "America/New_York": "뉴욕",
  "America/Los_Angeles": "새너제이",
  "America/Sao_Paulo": "상파울루",
  "Australia/Sydney": "시드니",
};

function getShortTimezoneLabel(timezone: string) {
  return TIMEZONE_LABELS[timezone] ?? timezone.split("/").at(-1)?.replaceAll("_", " ") ?? timezone;
}

/**
 * 하루 24시간을 가로축으로 펼쳐, 팀원 각자의 "지금 현지 시각"을 같은 축 위에 점으로 찍는다.
 * 실시간 회의 없이도 "지금 누가 깨어있는지"를 한눈에 보여주는 것이 이 서비스의 핵심 화면.
 */
export default function WorldClockStrip({ members, title = "지금, 팀은 어디쯤 깨어있을까요" }: WorldClockStripProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // 같은 시간대(또는 UTC 오프셋이 같은 시간대)의 팀원은 pct가 정확히 같아 마커가 완전히
  // 겹쳐 하나만 보이므로, 같은 슬롯 안에서는 좌우로 살짝 흩어 각자 눈에 띄게 한다.
  const slots = new Map<number, TimezoneEntry[]>();
  members.forEach((m) => {
    const { hour, minute } = getLocalTimeParts(m.timezone, now);
    const key = hour * 60 + minute;
    const slot = slots.get(key);
    if (slot) slot.push(m);
    else slots.set(key, [m]);
  });

  const positioned = members.map((m) => {
    const { hour, minute } = getLocalTimeParts(m.timezone, now);
    const pct = ((hour + minute / 60) / 24) * 100;
    const slot = slots.get(hour * 60 + minute)!;
    const offsetPx = slot.length > 1 ? (slot.indexOf(m) - (slot.length - 1) / 2) * 18 : 0;
    return { member: m, pct, offsetPx, phase: getDayPhase(hour) };
  });

  return (
    <div className="rounded-2xl bg-surface border border-surface-3 p-6">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h2 className="font-display text-lg text-ink">{title}</h2>
        </div>
        <span className="font-mono text-xs text-ink-faint">
          {now.toLocaleDateString("ko-KR").replace(/\.$/, "")}
        </span>
      </div>

      <div className="relative pt-12 pb-9">
        {/* 배경 그라데이션: 자정→새벽→낮→저녁→자정 */}
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, #10131A 0%, #4A5482 18%, #7C8FE0 24%, #F2A65A 40%, #F2A65A 62%, #7C8FE0 78%, #4A5482 84%, #10131A 100%)",
          }}
        />

        {/* 시각 눈금 */}
        <div className="absolute left-0 right-0 top-16 flex justify-between font-mono text-[10px] text-ink-faint px-0">
          {HOUR_MARKS.map((h) => (
            <span key={h}>{String(h % 24).padStart(2, "0")}</span>
          ))}
        </div>

        {/* 팀원 마커 */}
        {positioned.map(({ member, pct, offsetPx, phase }) => {
          const isAvailable = !getUnavailabilityHint(member.timezone, now);

          return (
            <div
              key={member.user_id}
              className="group absolute -translate-x-1/2 cursor-default hover:z-30"
              style={{ left: `calc(${pct}% + ${offsetPx}px)`, top: "0" }}
            >
              <div className="flex flex-col items-center">
                <div
                  className="w-7 h-7 rounded-full border-2 border-void flex items-center justify-center text-[10px] font-semibold text-void"
                  style={{ backgroundColor: member.avatarColor }}
                  title={member.name}
                >
                  {member.name.slice(0, 1)}
                </div>
                <span className={`mt-1 w-1.5 h-1.5 rounded-full ${PHASE_DOT[phase]}`} />
              </div>

              {/* 호버 툴팁 */}
              <div className="pointer-events-none absolute z-20 left-1/2 -translate-x-1/2 top-full mt-2 w-44 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition origin-top">
                <div className="rounded-lg bg-surface-2 border border-surface-3 shadow-panel px-3 py-2.5">
                  <p className="text-xs font-medium text-ink">{member.name}</p>
                  <p className="font-mono text-[11px] text-ink mt-1 whitespace-nowrap">
                    {formatLocalTime(member.timezone, now)} · {getShortTimezoneLabel(member.timezone)}
                  </p>
                  <p className={`text-[11px] mt-1 ${isAvailable ? "text-consensus" : "text-ink-faint"}`}>
                    {isAvailable ? "현재 근무 가능한 시간이에요" : "현재 근무 시간이 아니에요"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
