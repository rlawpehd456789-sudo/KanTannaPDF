'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorInfo } from '@/lib/errorTypes';

interface ErrorMessageProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onReset?: () => void;
}

export function ErrorMessage({ error, onRetry, onReset }: ErrorMessageProps) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">오류 발생</CardTitle>
        </div>
        <CardDescription className="mt-2">
          {error.message}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error.solution && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">해결 방법:</p>
            <p className="text-sm text-muted-foreground">{error.solution}</p>
          </div>
        )}
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} className="flex-1">
              다시 시도
            </Button>
          )}
          {onReset && (
            <Button onClick={onReset} variant="outline" className="flex-1">
              새 파일 업로드
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

