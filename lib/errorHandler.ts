/**
 * 전역 에러 핸들러 설정
 * window.onerror와 unhandledrejection 이벤트를 처리합니다.
 */

interface ErrorReport {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  error?: Error;
  timestamp: number;
}

/**
 * 에러 리포트를 로깅합니다 (개발 모드에서만)
 */
function logError(report: ErrorReport) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Global Error Handler:', report);
  }
  
  // 프로덕션에서는 에러 리포팅 서비스로 전송할 수 있습니다
  // 예: Sentry, LogRocket 등
}

/**
 * 전역 에러 핸들러 초기화
 */
export function setupGlobalErrorHandlers() {
  // 동기 에러 핸들러
  window.onerror = (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ) => {
    const report: ErrorReport = {
      message: typeof message === 'string' ? message : message.toString(),
      source,
      lineno,
      colno,
      error,
      timestamp: Date.now(),
    };
    
    logError(report);
    
    // 기본 에러 핸들러도 실행 (콘솔에 표시)
    return false;
  };

  // 비동기 에러 핸들러 (Promise rejection)
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const report: ErrorReport = {
      message: `Unhandled Promise Rejection: ${event.reason}`,
      error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      timestamp: Date.now(),
    };
    
    logError(report);
    
    // 기본 동작 방지 (콘솔에 에러 표시되지 않음)
    // event.preventDefault();
  });

  // 메모리 사용량 모니터링 (개발 모드에서만)
  if (process.env.NODE_ENV === 'development' && 'performance' in window && 'memory' in (performance as any)) {
    const checkMemory = () => {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1048576;
      const totalMB = memory.totalJSHeapSize / 1048576;
      const limitMB = memory.jsHeapSizeLimit / 1048576;
      
      // 메모리 사용량이 80% 이상이면 경고
      if (usedMB / limitMB > 0.8) {
        console.warn(`메모리 사용량이 높습니다: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB`);
      }
    };
    
    // 5초마다 메모리 체크
    setInterval(checkMemory, 5000);
  }
}

