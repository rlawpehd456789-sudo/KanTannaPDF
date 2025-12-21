'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorInfo } from '@/lib/errorTypes';
import { useI18n } from '@/lib/i18n/context';

interface ErrorMessageProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onReset?: () => void;
}

export function ErrorMessage({ error, onRetry, onReset }: ErrorMessageProps) {
  const { t } = useI18n();

  // 에러 타입에 따라 번역 키 매핑
  const getErrorKey = (type: string): string => {
    const keyMap: Record<string, string> = {
      'INVALID_FILE_TYPE': 'error.invalidFileType',
      'FILE_TOO_LARGE': 'error.fileTooLarge',
      'CORRUPTED_PDF': 'error.corruptedPdf',
      'PROCESSING_ERROR': 'error.processingError',
      'MEMORY_ERROR': 'error.memoryError',
      'UNKNOWN_ERROR': 'error.unknownError',
    };
    return keyMap[type] || 'error.unknownError';
  };

  const getSolutionKey = (type: string): string => {
    const keyMap: Record<string, string> = {
      'INVALID_FILE_TYPE': 'error.invalidFileTypeSolution',
      'FILE_TOO_LARGE': 'error.fileTooLargeSolution',
      'CORRUPTED_PDF': 'error.corruptedPdfSolution',
      'PROCESSING_ERROR': 'error.processingErrorSolution',
      'MEMORY_ERROR': 'error.memoryErrorSolution',
      'UNKNOWN_ERROR': 'error.unknownErrorSolution',
    };
    return keyMap[type] || 'error.unknownErrorSolution';
  };

  // 번역된 메시지 사용 (에러 객체에 번역 키가 없으면 원본 메시지 사용)
  const displayMessage = error.message || t(getErrorKey(error.type));
  const displaySolution = error.solution ? t(getSolutionKey(error.type)) : undefined;

  return (
    <Card className="border-destructive">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">{t('error.title')}</CardTitle>
        </div>
        <CardDescription className="mt-2">
          {displayMessage}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {displaySolution && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">{t('error.solution')}</p>
            <p className="text-sm text-muted-foreground">{displaySolution}</p>
          </div>
        )}
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} className="flex-1">
              {t('common.retry')}
            </Button>
          )}
          {onReset && (
            <Button onClick={onReset} variant="outline" className="flex-1">
              {t('common.newFileUpload')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

