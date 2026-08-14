import { useEffect, useState } from "react";
import type { TimezoneEntry } from "../../../lib/api";
import { formatLocalTime, getDayPhase, getLocalTimeParts, getUnavailabilityHint } from "../../../lib/timezone";

interface WorldClockStripProps {
  members: TimezoneEntry[];
}

const PHASE_DOT: Record<string, string> = {
  deep_night: "bg-night",
  night: "bg-night-dim",
  early_morning: "bg-day-dim",
  day: "bg-day",
  evening: "bg-day-dim",
};

const HOUR_MARKS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

/**
 * 하루 24시간을 가로축으로 펼쳐, 팀원 각자의 "지금 현지 시각"을 같은 축 위에 점으로 찍는다.
 * 실시간 회의 없이도 "지금 누가 깨어있는지"를 한눈에 보여주는 것이 이 서비스의 핵심 화면.
 */
export default function WorldClockStrip({ members }: WorldClockStripProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const positioned = members.map((m) => {
    const { hour, minute } = getLocalTimeParts(m.timezone, now);
    const pct = ((hour + minute / 60) / 24) * 100;
    return { member: m, hour, minute, pct, phase: getDayPhase(hour) };
  });

  return (
    <div className="rounded-2xl bg-surface border border-surface-3 p-6">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h2 className="font-display text-lg text-ink">지금, 팀은 어디쯤 깨어있을까요</h2>
        </div>
        <span className="font-mono text-xs text-ink-faint">
          {now.toLocaleDateString("ko-KR").replace(/\.$/, "")}
        </span>
      </div>

      <div className="relative pt-10 pb-16">
        {/* 배경 그라데이션: 자정→새벽→낮→저녁→자정 */}
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, #10131A 0%, #4A5482 18%, #7C8FE0 24%, #F2A65A 40%, #F2A65A 62%, #7C8FE0 78%, #4A5482 84%, #10131A 100%)",
          }}
        />

        {/* 시각 눈금 */}
        <div className="absolute left-0 right-0 top-6 flex justify-between font-mono text-[10px] text-ink-faint px-0">
          {HOUR_MARKS.map((h) => (
            <span key={h}>{String(h % 24).padStart(2, "0")}</span>
          ))}
        </div>

        {/* 팀원 마커 */}
        {positioned.map(({ member, hour, minute, pct, phase }, idx) => (
          <div
            key={member.user_id}
            className="group absolute -translate-x-1/2 cursor-default"
            style={{ left: `${pct}%`, top: idx % 2 === 0 ? "-24px" : "52px" }}
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
            <div className="pointer-events-none absolute z-20 left-1/2 -translate-x-1/2 top-full mt-2 w-52 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition origin-top">
              <div className="rounded-lg bg-surface-2 border border-surface-3 shadow-panel px-3 py-2.5">
                <p className="text-xs font-medium text-ink">{member.name}</p>
                <p className="text-[11px] text-ink-dim">{member.role === "PM" ? "PM" : "멤버"}</p>
                <p className="font-mono text-xs text-ink mt-1.5">
                  {formatLocalTime(member.timezone, now)} · {member.timezone.replace("_", " ")}
                </p>
                <p className="text-[11px] text-ink-faint mt-1">
                  {getUnavailabilityHint(member.timezone, now) ??
                    `${hour}시 ${String(minute).padStart(2, "0")}분, 근무 가능 시간대예요`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
