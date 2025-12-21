'use client';

import { useI18n } from '@/lib/i18n/context';

interface LoadingSpinnerProps {
  message?: string;
  progress?: {
    current: number;
    total: number;
  };
}

export function LoadingSpinner({ 
  message,
  progress 
}: LoadingSpinnerProps) {
  const { t } = useI18n();
  const progressPercentage = progress 
    ? Math.round((progress.current / progress.total) * 100)
    : undefined;

  const displayMessage = message || t('processing.splitting');

  return (
    <div className="flex flex-row items-center justify-center gap-6 py-4">
      <div className="relative flex-shrink-0">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-base font-medium">{displayMessage}</p>
        {progress && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('processing.processingPages', { current: progress.current, total: progress.total })}
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
            {t('processing.pleaseWait')}
          </p>
        )}
      </div>
    </div>
  );
}

