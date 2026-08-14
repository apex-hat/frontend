import { useEffect, useState } from "react";

const CITIES = [
  { name: "서울", timezone: "Asia/Seoul" },
  { name: "도쿄", timezone: "Asia/Tokyo" },
  { name: "베를린", timezone: "Europe/Berlin" },
  { name: "런던", timezone: "Europe/London" },
  { name: "뉴욕", timezone: "America/New_York" },
  { name: "새너제이", timezone: "America/Los_Angeles" },
];

const formatTime = (timezone: string, date: Date) =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

export default function RotatingWorldClock() {
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(new Date());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const clockTimer = window.setInterval(() => setNow(new Date()), 1_000);
    let transitionTimer: number | undefined;
    const cityTimer = window.setInterval(() => {
      setVisible(false);
      transitionTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % CITIES.length);
        setVisible(true);
      }, 250);
    }, 2_400);

    return () => {
      window.clearInterval(clockTimer);
      window.clearInterval(cityTimer);
      window.clearTimeout(transitionTimer);
    };
  }, []);

  const city = CITIES[index];

  return (
    <p
      className={`font-mono text-sm text-ink-dim transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
      aria-live="polite"
    >
      <span className="text-ink">{city.name}</span>
      <span className="mx-2 text-ink-faint">·</span>
      {formatTime(city.timezone, now)}
    </p>
  );
}
