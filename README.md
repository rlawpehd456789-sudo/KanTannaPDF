# PDF 페이지 분할 서비스

PDF 파일을 업로드하면 각 페이지를 독립적인 PDF 파일로 분할하여 개별 다운로드할 수 있는 웹 서비스입니다.

## 주요 기능

- ✅ PDF 파일 드래그앤드롭 또는 클릭으로 업로드
- ✅ 업로드된 PDF의 모든 페이지를 독립 PDF로 분할
- ✅ 각 페이지를 개별적으로 다운로드 또는 선택한 페이지를 ZIP으로 일괄 다운로드
- ✅ 실시간 진행률 표시
- ✅ 포괄적인 에러 처리 및 사용자 친화적인 에러 메시지
- ✅ 반응형 디자인 (모바일, 태블릿, 데스크톱 지원)
- ✅ 부드러운 화면 전환 애니메이션
- ✅ 클라이언트 사이드 처리 (서버에 파일이 저장되지 않음)
- ✅ 성능 최적화 및 메모리 관리
- ✅ 접근성 지원 (ARIA 라벨, 키보드 네비게이션)

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **UI Components**: Shadcn/ui
- **Styling**: Tailwind CSS
- **PDF 처리**: pdf-lib
- **애니메이션**: framer-motion
- **ZIP 생성**: jszip

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 3. 빌드

```bash
npm run build
npm start
```

## 프로젝트 구조

```
PDF/
├── app/
│   ├── layout.tsx              # 루트 레이아웃 (Error Boundary 포함)
│   ├── page.tsx                # 메인 페이지
│   └── globals.css             # 전역 스타일
├── components/
│   ├── FileUpload.tsx          # 파일 업로드 컴포넌트
│   ├── LoadingSpinner.tsx      # 로딩 스피너 (진행률 표시)
│   ├── ErrorMessage.tsx        # 에러 메시지 컴포넌트
│   ├── ErrorBoundary.tsx       # React Error Boundary
│   ├── ClientErrorHandler.tsx  # 전역 에러 핸들러
│   └── ui/                     # Shadcn/ui 컴포넌트
├── lib/
│   ├── pdfSplitter.ts          # PDF 분할 로직
│   ├── zipDownloader.ts        # ZIP 다운로드 로직
│   ├── errorTypes.ts           # 에러 타입 정의
│   ├── errorHandler.ts         # 전역 에러 핸들러
│   └── utils.ts                # 유틸리티 함수
└── package.json
```

## 사용 방법

1. **PDF 파일 업로드**
   - 드래그앤드롭: PDF 파일을 드롭 영역에 드래그
   - 클릭: 드롭 영역을 클릭하여 파일 선택
   - 키보드: Tab 키로 드롭 영역에 포커스 후 Enter/Space로 파일 선택

2. **PDF 분할 처리**
   - 업로드된 PDF가 자동으로 각 페이지로 분할됩니다
   - 처리 중 실시간 진행률이 표시됩니다 (예: "3/10 페이지 처리 중")

3. **페이지 다운로드**
   - **개별 다운로드**: 각 페이지별 다운로드 버튼 클릭
   - **전체 다운로드**: "전체 다운로드" 버튼으로 모든 페이지를 ZIP으로 다운로드
   - **선택 다운로드**: 체크박스로 원하는 페이지를 선택 후 "선택 다운로드" 버튼 클릭
   - 파일명 형식: `원본파일명_page_01.pdf`

4. **새 파일 업로드**
   - "새 파일 업로드" 버튼을 클릭하여 다른 PDF를 처리할 수 있습니다

## 제한 사항

- 최대 파일 크기: 100MB
- 지원 파일 형식: PDF만 지원
- 브라우저: Chrome, Firefox, Safari, Edge (최신 버전)

## 구현 완료 항목

### Phase 1: 기본 기능 (MVP)
- [x] Next.js 프로젝트 설정 완료
- [x] Shadcn/ui 설정 완료
- [x] pdf-lib 설치 및 테스트 완료
- [x] 파일 업로드 컴포넌트 구현 완료
- [x] PDF 분할 로직 구현 완료
- [x] 메인 페이지 구현 완료
- [x] 기본 스타일링 완료

### Phase 2: UI/UX 개선
- [x] 로딩 컴포넌트 구현 (진행률 표시)
- [x] 에러 처리 개선
- [x] 화면 전환 애니메이션
- [x] 반응형 디자인 구현
- [x] 사용자 피드백 개선
- [x] 새 파일 업로드 기능 추가

### Phase 3: 최적화 및 안정성
- [x] 성능 최적화 (useMemo, useCallback, 코드 스플리팅)
- [x] 메모리 관리 개선 (Blob URL 정리, 메모리 모니터링)
- [x] 진행률 표시 개선 (실시간 업데이트)
- [x] 접근성 개선 (ARIA 라벨, 키보드 네비게이션)
- [x] 에러 바운더리 및 예외 처리 강화
- [x] 문서화 완료

## 향후 개선 사항

- Web Workers를 활용한 백그라운드 처리
- 페이지 범위 선택 분할
- 여러 PDF 파일 동시 처리
- PDF 병합 기능
- 다크 모드 지원
- 다국어 지원

## 라이선스

ISC

