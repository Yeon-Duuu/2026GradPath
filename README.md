# GradPath — 계명대학교 졸업요건 시뮬레이터

계명대학교 컴퓨터공학과 학생이 이수한 과목을 입력하면 졸업 가능 여부를 즉시 확인할 수 있는 React SPA입니다.

**배포 주소:** https://gradpath-phi.vercel.app  
**사용 설명서:** https://gradpath-phi.vercel.app/manual

## 주요 기능

- **대시보드** — 이수율 도넛/막대 차트, 레벨 시스템(🌱→🎓), 뱃지 5종, 경고 목록, 과목 검색 추가
- **시뮬레이터** — 수강 예정 과목을 가상으로 추가해 졸업 가능 여부 사전 확인
- **로드맵** — 취업·대학원·자격증 목표별 선배 로드맵 (정적 10개 + 관리자 등록 가능)
- **게시판** — 선후배 간 진로·취업·대학원 질문 게시판 (Firebase 실시간 공유, 전용 작성/답변 페이지)
- **타이머** — 뽀모도로 집중 타이머 (25분/5분, 7일 세션 기록)
- **사용 설명서** — 앱 내 `/manual` 페이지

## 졸업 요건

2026 학과 생활 가이드북 기반 실데이터. 2015~2026학년도 입학생 지원.

## 기술 스택

Vite · React 19 · React Router v7 · Tailwind CSS v4 · Recharts · React Hook Form · Firebase Firestore · localStorage

## 관리자 계정

아이디 `cmd` — 게시글에서 로드맵 등록(자동/수동), 로드맵 직접 등록·삭제 가능.

## 개발 실행

```bash
npm install
npm run dev
```

## 배포 방법

```bash
git add <파일들>
git commit -m "커밋 메시지"
git push origin master   # Vercel 자동 재배포
```
