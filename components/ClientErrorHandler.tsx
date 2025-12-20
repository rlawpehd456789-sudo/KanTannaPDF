'use client';

import { useEffect } from 'react';
import { setupGlobalErrorHandlers } from '@/lib/errorHandler';

interface ClientErrorHandlerProps {
  children: React.ReactNode;
}

/**
 * 클라이언트 사이드에서 전역 에러 핸들러를 설정하는 컴포넌트
 */
export function ClientErrorHandler({ children }: ClientErrorHandlerProps) {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return <>{children}</>;
}

