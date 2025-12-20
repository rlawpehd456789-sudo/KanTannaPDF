'use client';

interface LoadingSpinnerProps {
  message?: string;
  progress?: {
    current: number;
    total: number;
  };
}

export function LoadingSpinner({ 
  message = 'PDF를 분할하는 중...',
  progress 
}: LoadingSpinnerProps) {
  const progressPercentage = progress 
    ? Math.round((progress.current / progress.total) * 100)
    : undefined;

  return (
    <div className="flex flex-row items-center justify-center gap-6 py-4">
      <div className="relative flex-shrink-0">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-base font-medium">{message}</p>
        {progress && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {progress.current} / {progress.total} 페이지 처리 중
              </p>
              <p className="text-xs text-muted-foreground">
                {progressPercentage}%
              </p>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
        {!progress && (
          <p className="text-sm text-muted-foreground">
            잠시만 기다려주세요
          </p>
        )}
      </div>
    </div>
  );
}

