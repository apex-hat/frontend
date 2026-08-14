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
export default function AuthLayout({ children, eyebrow, title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden lg:flex flex-col justify-center overflow-hidden bg-surface px-14 py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "linear-gradient(120deg, #10131A 0%, #1B2030 35%, #2E3650 60%, #4A5482 78%, #F2A65A 100%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_45%)]" />

        <div className="relative z-10 max-w-xl -translate-y-4">
          <div className="mb-8 flex items-center gap-4">
            <span className="h-px w-10 bg-day" aria-hidden="true" />
            <p className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink">
              Meridian
            </p>
          </div>
          <h1 className="font-display text-5xl xl:text-[3.5rem] font-medium leading-[1.12] tracking-[-0.035em] text-ink">
            <span className="block">지구 반대편 동료도,</span>
            <span className="mt-2 block text-day">같은 회의실에 있는 것처럼</span>
          </h1>
        </div>

        <div className="absolute z-10 left-14 bottom-12">
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
