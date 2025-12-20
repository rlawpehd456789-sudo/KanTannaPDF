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
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium">{message}</p>
        {progress && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {progress.current} / {progress.total} 페이지 처리 중
            </p>
            <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {progressPercentage}%
            </p>
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

