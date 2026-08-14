import type { ReactNode } from "react";
import RotatingWorldClock from "./RotatingWorldClock";

interface AuthLayoutProps {
  children: ReactNode;
  eyebrow: string;
  title: ReactNode;
}

/**
 * 로그인/회원가입 공통 셸.
 * 왼쪽은 "시차를 넘나드는 팀"이라는 제품 컨셉을 시각적으로 보여주는 히어로 패널,
 * 오른쪽은 실제 폼 영역입니다.
 */
export default function AuthLayout({
  children,
  eyebrow,
  title,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,1fr)]">
      <div className="relative hidden lg:flex flex-col justify-center overflow-hidden bg-surface px-10 py-10 xl:px-14 xl:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "linear-gradient(120deg, #10131A 0%, #1B2030 35%, #2E3650 60%, #4A5482 78%, #F2A65A 100%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_45%)]" />

        <div className="relative z-10 -translate-y-3 xl:-translate-y-4">
          <div className="mb-7 flex items-center gap-4 xl:mb-8">
            <span className="h-px w-10 bg-day" aria-hidden="true" />
            <p className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink">
              Meridian
            </p>
          </div>
          <h1 className="font-display text-[clamp(1.9rem,3vw,2.85rem)] font-medium leading-[1.16] tracking-[-0.025em] text-ink">
            <span className="block whitespace-nowrap">시간과 문화를 넘어</span>
            <span className="mt-2 block whitespace-nowrap text-day">함께 만드는 하나의 방향</span>
          </h1>
        </div>

        <div className="absolute z-10 bottom-10 left-10 xl:bottom-12 xl:left-14">
          <RotatingWorldClock />
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16 bg-void">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint mb-2">
              {eyebrow}
            </p>
            <h2 className="font-display text-2xl text-ink mb-1">{title}</h2>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
