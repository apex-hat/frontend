# Meridian Frontend

AI 기반 글로벌 비동기 협업 플랫폼 **Meridian**의 Frontend Repository입니다.

Meridian은 글로벌 팀의 협업 과정에서 발생하는 **문화적 표현 차이**, **시차**, **의견 정리의 어려움**을 AI로 보완하여 효율적인 비동기 의사결정을 지원합니다.

---

## 1. Project Overview

### Meridian

> AI가 문화적 맥락과 시차를 이해하여 글로벌 팀의 비동기 협업을 돕는 AI 협업 플랫폼

### 핵심 기능

* AI 문화 맥락 분석
* 글로벌 팀 비동기 의견 수집
* AI 합의 상태 및 핵심 쟁점 요약
* 숨겨진 반대 의견 및 완곡한 표현 분석
* 글로벌 팀원의 시간대 및 응답 현황 확인
* 협업 진행 상황 알림

### 주요 사용자 흐름

```text
제안 작성
   ↓
AI 문화 맥락 분석
   ↓
제안 등록
   ↓
팀원 비동기 의견 작성
   ↓
시간대 / 응답 현황 확인
   ↓
AI 합의 요약
   ↓
최종 의사결정
```

---

# 2. Tech Stack

| 기술             | 용도                  |
| -------------- | ------------------- |
| React          | UI 개발               |
| TypeScript     | 정적 타입 관리            |
| Vite           | Frontend Build Tool |
| CSS Modules    | 컴포넌트 스타일링           |
| React Router   | 페이지 라우팅             |
| Axios          | Backend REST API 통신 |
| TanStack Query | 서버 상태 관리 및 API 캐싱   |

> 현재 프로젝트는 **React + TypeScript + Vite**를 기반으로 개발하며, 필요한 라이브러리는 기능 개발 과정에서 추가합니다.

---

# 3. Frontend Architecture

Frontend는 UI와 사용자 인터랙션을 담당하고 Backend REST API와 통신합니다.

```text
┌─────────────────────────────┐
│         React App           │
│    Vite + TypeScript        │
└──────────────┬──────────────┘
               │
               │ User Interaction
               ▼
┌─────────────────────────────┐
│        Pages / UI           │
│                             │
│ Proposal                    │
│ Opinion                     │
│ Consensus                   │
│ Dashboard                   │
│ Authentication              │
└──────────────┬──────────────┘
               │
               │ API Layer
               ▼
┌─────────────────────────────┐
│ Axios / TanStack Query      │
└──────────────┬──────────────┘
               │
               │ REST API
               ▼
┌─────────────────────────────┐
│     Meridian Backend        │
│                             │
│ Firebase Authentication     │
│ Spring Boot                 │
│ PostgreSQL                  │
│ AI API                      │
└─────────────────────────────┘
```

Frontend에서는 AI 모델을 직접 호출하지 않습니다.

문화 맥락 분석 및 AI 합의 요약은 Backend API를 통해 요청합니다.

---

# 4. Frontend Feature

## 4.1 Authentication

사용자의 로그인 및 회원가입을 담당합니다.

### 주요 기능

* 로그인
* 회원가입
* 로그아웃
* 현재 로그인 사용자 조회
* 인증 상태 관리

### 관련 API

```text
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/logout
GET  /api/users/me
```

---

## 4.2 Proposal

글로벌 팀원들과 논의할 제안을 작성하고 등록합니다.

### 주요 기능

* 제안 작성
* 제목 및 내용 입력
* 대상 팀 선택
* 대상 문화권 선택
* 마감 기한 설정
* 제안 목록 조회
* 제안 상세 조회
* 제안 수정 및 삭제

### 관련 API

```text
POST   /api/proposals
GET    /api/proposals
GET    /api/proposals/{proposalId}
PUT    /api/proposals/{proposalId}
DELETE /api/proposals/{proposalId}
```

---

## 4.3 AI Cultural Context Analysis

제안을 등록하기 전에 AI가 문화적 맥락에서 발생할 수 있는 오해를 분석합니다.

### 제공 정보

* 문화권별 표현 해석
* 오해 가능성이 있는 표현
* 문화적 위험도
* 수정 문장 제안

### 사용자 흐름

```text
제안 작성
   ↓
AI 분석 요청
   ↓
원문 / 문화적 해석 / 수정안 확인
   ↓
원문 유지 또는 수정안 적용
   ↓
최종 제안 등록
```

### 관련 API

```text
POST /api/ai/context-analysis
```

---

# 5. Async Opinion

등록된 제안에 대해 팀원이 자신의 시간대에 맞춰 의견을 작성합니다.

### Opinion Type

```text
AGREE
DISAGREE
CONDITIONAL_AGREE
```

### 주요 기능

* 찬성
* 반대
* 조건부 찬성
* 코멘트 작성
* 의견 목록 조회
* 의견 수정
* 의견 삭제
* 응답 상태 확인

### 관련 API

```text
POST   /api/proposals/{proposalId}/opinions
GET    /api/proposals/{proposalId}/opinions
PUT    /api/opinions/{opinionId}
DELETE /api/opinions/{opinionId}
```

### UI Flow

```text
제안 확인
   ↓
찬성 / 반대 / 조건부 찬성 선택
   ↓
코멘트 작성
   ↓
의견 등록
   ↓
팀원 의견 목록 갱신
```

---

# 6. AI Consensus

팀원들의 의견을 AI가 분석하여 현재 합의 상태를 제공합니다.

### 제공 정보

* 전체 합의 상태
* 핵심 쟁점
* 문화적 표현 분석
* 숨겨진 반대 의견
* 권장 후속 조치

### UI 예시

```text
AI Consensus

상태
이견 있음

핵심 쟁점
- 개발 일정
- MVP 기능 범위

숨겨진 이견
- 일부 구성원이 조건부로 동의하고 있어
  완전한 합의로 보기 어려움

권장 후속 조치
- MVP 범위를 조정한 뒤 의견을 다시 확인
```

### 관련 API

```text
POST /api/ai/consensus-summary
POST /api/ai/intent-analysis
```

---

# 7. Global Time Zone Dashboard

글로벌 팀원의 현재 상황을 한 화면에서 확인합니다.

### 표시 정보

* 팀원 국가
* Time Zone
* 현지 시간
* 현재 근무 여부
* 마지막 접속 시간
* 제안 응답 여부
* 전체 응답 진행률

### 상황 안내 예시

```text
New York

현재 현지 시간은 02:30입니다.

현재 근무 시간이 아니므로
아직 제안에 응답하지 않았을 가능성이 높습니다.
```

### 관련 API

```text
GET /api/dashboard/timezones
GET /api/dashboard/status
```

---

# 8. Notification

협업 과정에서 발생하는 주요 이벤트를 사용자에게 전달합니다.

### Notification Event

```text
PROPOSAL_CREATED
OPINION_REQUESTED
DEADLINE_APPROACHING
CONSENSUS_SUMMARY_COMPLETED
```

### 관련 API

```text
GET   /api/notifications
PATCH /api/notifications/{notificationId}
```

---

# 9. Recommended Frontend Structure

```text
frontend/
├── public/
│
├── src/
│   ├── api/
│   │   ├── authApi.ts
│   │   ├── proposalApi.ts
│   │   ├── opinionApi.ts
│   │   ├── consensusApi.ts
│   │   ├── dashboardApi.ts
│   │   └── notificationApi.ts
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Button.tsx
│   │   │   └── Loading.tsx
│   │   │
│   │   ├── proposal/
│   │   │
│   │   ├── opinion/
│   │   │   ├── VoteSelector.tsx
│   │   │   ├── OpinionForm.tsx
│   │   │   ├── OpinionCard.tsx
│   │   │   ├── OpinionList.tsx
│   │   │   └── ResponseStatus.tsx
│   │   │
│   │   ├── consensus/
│   │   │   ├── ConsensusCard.tsx
│   │   │   ├── IssueList.tsx
│   │   │   ├── HiddenDisagreement.tsx
│   │   │   └── NextActionCard.tsx
│   │   │
│   │   └── dashboard/
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── proposal/
│   │   ├── consensus/
│   │   ├── dashboard/
│   │   └── notification/
│   │
│   ├── hooks/
│   ├── mocks/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

> 실제 프로젝트 구조는 개발 과정에서 기능에 따라 변경될 수 있습니다.

---

# 10. Frontend Responsibility

Frontend는 세 개의 주요 기능 영역으로 나누어 개발합니다.

## Frontend 1 — Proposal

Branch:

```text
feature/proposal
```

담당 기능:

* 제안 작성
* 대상 팀 및 문화권 선택
* AI 문화 맥락 분석
* AI 분석 결과 표시
* 수정안 적용
* 최종 제안 등록
* 제안 목록 및 상세

---

## Frontend 2 — Opinion & Consensus

Branch:

```text
feature/consensus
```

담당 기능:

* 비동기 의견 작성
* 찬성 / 반대 / 조건부 찬성
* 의견 코멘트
* 팀원 의견 목록
* 응답 현황
* AI 합의 요약
* 핵심 쟁점
* 숨겨진 반대 의견
* 권장 후속 조치

---

## Frontend 3 — Dashboard & Auth

Branch:

```text
feature/dashboard
```

담당 기능:

* 로그인
* 회원가입
* 로그아웃
* 공통 Layout
* Header / Sidebar
* 글로벌 시간대 대시보드
* 팀원 위치 및 현지 시간
* 응답 진행률
* 알림

---

# 11. Development Flow

Backend API가 완성되기 전까지는 Mock 데이터를 사용하여 UI를 먼저 개발합니다.

```text
Type 정의
   ↓
Mock Data 작성
   ↓
Component 구현
   ↓
Page 연결
   ↓
UI 테스트
   ↓
Backend API 연동
   ↓
통합 테스트
```

API 호출 코드는 UI 컴포넌트에 직접 작성하지 않고 `api/` 디렉터리에서 관리합니다.

예:

```text
Component
   ↓
API Function
   ↓
Axios / TanStack Query
   ↓
Backend REST API
```

---

# 12. Local Development

## Requirements

```text
Node.js 20+
npm
Git
```

## Repository Clone

```bash
git clone https://github.com/apex-hat/frontend.git
cd frontend
```

## Package Install

```bash
npm install
```

## Development Server

```bash
npm run dev
```

기본 로컬 주소:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

---

# 13. Git Convention

## Branch

```text
main
└── develop
    ├── feature/proposal
    ├── feature/consensus
    └── feature/dashboard
```

### Branch 역할

```text
main
→ 최종 배포 및 안정 버전

develop
→ Frontend 통합 개발 브랜치

feature/*
→ 담당 기능 개발
```

`main`과 `develop`에는 직접 기능 코드를 Push하지 않습니다.

각 기능은 본인의 `feature/*` 브랜치에서 작업합니다.

---

## 작업 흐름

```text
develop 최신화
   ↓
feature 브랜치 생성
   ↓
기능 개발
   ↓
commit
   ↓
feature 브랜치 push
   ↓
Pull Request
   ↓
코드 / 충돌 확인
   ↓
develop Merge
```

### 예시

```bash
git checkout develop
git pull origin develop

git checkout -b feature/consensus
```

작업 후:

```bash
git add .
git commit -m "기능: 비동기 의견 작성 UI 구현"
git push origin feature/consensus
```

GitHub에서:

```text
feature/consensus
        ↓ PR
     develop
```

으로 Pull Request를 생성합니다.

PR 생성 후 바로 Merge하지 않고 통합 확인 후 Merge합니다.

---

# 14. Commit Convention

커밋 메시지는 팀원이 쉽게 확인할 수 있도록 한국어를 사용합니다.

예:

```text
초기 세팅: React TypeScript Vite 프로젝트 생성

기능: 의견 작성 UI 구현
기능: AI 합의 결과 카드 구현

수정: 의견 제출 오류 수정

스타일: 합의 결과 화면 레이아웃 수정

리팩터링: 의견 관련 타입 구조 변경

문서: Frontend README 수정
```

---

# 15. Collaboration Rules

### 1. 담당 기능 분리

각 개발자는 가능한 한 자신의 담당 폴더에서 작업합니다.

```text
proposal     → Frontend 1
opinion      → Frontend 2
consensus    → Frontend 2
dashboard    → Frontend 3
auth         → Frontend 3
```

### 2. 공통 파일 수정 주의

다음 파일은 여러 개발자가 사용할 수 있으므로 대규모 수정 전 팀원에게 공유합니다.

```text
App.tsx
main.tsx
global.css
package.json
공통 Layout
```

### 3. API 규격 통일

API 필드 및 Enum 값은 Backend API 명세를 기준으로 사용합니다.

예:

```text
AGREE
DISAGREE
CONDITIONAL_AGREE
```

Frontend에서 임의의 별도 이름을 만들지 않습니다.

### 4. Mock First

Backend API가 준비되지 않은 기능은 Mock 데이터를 이용하여 UI부터 구현합니다.

### 5. Pull Request

각자 다음 단계까지 진행합니다.

```text
개발
→ Commit
→ Push
→ develop 대상 PR 생성
```

Merge는 PR 및 충돌 확인 후 진행합니다.

---

# 16. MVP Priority

## P0 — 반드시 구현

* 로그인 / 사용자 정보
* 팀 조회
* 제안 생성 및 조회
* AI 문화 맥락 분석
* 비동기 의견 작성 및 조회
* AI 합의 요약

## P1 — 데모 완성도 향상

* 글로벌 시간대 대시보드
* 응답 진행률
* 숨은 의도 분석
* 알림

## P2 — 향후 확장

* 이메일 알림
* Slack 연동
* Microsoft Teams 연동
* 다국어 번역
* 조직별 커뮤니케이션 스타일 학습
* AI 회의록 및 의사결정 이력

---

# 17. Core Demo Scenario

```text
[한국 디자이너]

제안 작성
"이 디자인으로 진행하는 게 괜찮을 것 같습니다.
다만 일정이 조금 걱정되네요."

        ↓

[AI 문화 맥락 분석]

문화권에 따라 다르게 해석될 수 있는
표현과 위험도를 분석

        ↓

[AI 수정 제안]

보다 명확한 표현으로 수정

        ↓

[제안 등록]

        ↓

[글로벌 팀원]

각자의 현지 시간에
찬성 / 반대 / 조건부 찬성 의견 작성

        ↓

[Global Dashboard]

팀원의 현지 시간 및
응답 현황 확인

        ↓

[AI Consensus]

합의 상태
핵심 쟁점
숨겨진 이견
권장 후속 조치

        ↓

[최종 의사결정]
```

---

# 18. Security

다음 정보는 Frontend Repository에 직접 저장하지 않습니다.

```text
API Key
Firebase Secret
Authentication Secret
Database Password
Private Key
```

환경 변수는 `.env` 파일로 관리하고 실제 값은 Git에 Commit하지 않습니다.

예:

```text
VITE_API_BASE_URL=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
```

`.env.example`에는 변수 이름만 작성하고 실제 Secret 값은 포함하지 않습니다.

---

# 19. Repository

Frontend:

```text
https://github.com/apex-hat/frontend
```

Backend:

```text
https://github.com/apex-hat/backend
```

---

# 20. Project

This project is developed for **LIKELION UNIV. 14th Hackathon**.
