import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
}

/**
 * 로그인/회원가입 공통 셸.
 * 왼쪽은 "시차를 넘나드는 팀"이라는 제품 컨셉을 시각적으로 보여주는 히어로 패널,
 * 오른쪽은 실제 폼 영역입니다.
 */
export default function AuthLayout({ children, eyebrow, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-surface px-14 py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "linear-gradient(120deg, #10131A 0%, #1B2030 35%, #2E3650 60%, #4A5482 78%, #F2A65A 100%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_45%)]" />

        <div className="relative z-10 font-display text-lg tracking-tight text-ink">
          Meridian
        </div>

        <div className="relative z-10 max-w-md">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-dim mb-4">
            {eyebrow}
          </p>
          <h1 className="font-display text-4xl leading-tight text-ink mb-4">
            지구 반대편 동료도,
            <br />
            같은 회의실에 있는 것처럼
          </h1>
          <p className="text-ink-dim leading-relaxed">
            시간대와 문화 차이 때문에 놓치던 합의를, AI가 비동기로 정리해드려요.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 font-mono text-xs text-ink-dim">
          <span>서울 · 07:12</span>
          <span className="w-1 h-1 rounded-full bg-ink-faint" />
          <span>베를린 · 23:12</span>
          <span className="w-1 h-1 rounded-full bg-ink-faint" />
          <span>새너제이 · 15:12</span>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16 bg-void">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint mb-2">
              {eyebrow}
            </p>
            <h2 className="font-display text-2xl text-ink mb-1">{title}</h2>
            <p className="text-sm text-ink-dim">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
