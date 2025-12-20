'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Upload } from 'lucide-react';
import type { SplitPdfResult } from '@/lib/pdfSplitter';
import { getErrorInfo, ErrorInfo, ErrorType } from '@/lib/errorTypes';
import { generateThumbnail } from '@/lib/pdfThumbnail';
import { InteractiveRobotSpline } from '@/components/ui/interactive-3d-robot';

type AppState = 'upload' | 'processing' | 'completed' | 'error';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [splitPdfs, setSplitPdfs] = useState<(SplitPdfResult & { thumbnail?: string })[]>([]);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number } | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 컴포넌트 언마운트 시 Blob URL 정리
  useEffect(() => {
    return () => {
      splitPdfs.forEach((pdf) => {
        if (pdf.thumbnail) {
          URL.revokeObjectURL(pdf.thumbnail);
        }
      });
    };
  }, [splitPdfs]);

  const validateFile = useCallback((file: File): boolean => {
    // 파일 확장자 검증
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorInfo({
        type: ErrorType.INVALID_FILE_TYPE,
        message: 'PDF 파일만 업로드할 수 있습니다.',
        solution: 'PDF 파일만 업로드할 수 있습니다. 파일 형식을 확인해주세요.',
      });
      return false;
    }

    // 파일 타입 검증
    if (file.type && file.type !== 'application/pdf') {
      setErrorInfo({
        type: ErrorType.INVALID_FILE_TYPE,
        message: 'PDF 파일만 업로드할 수 있습니다.',
        solution: 'PDF 파일만 업로드할 수 있습니다. 파일 형식을 확인해주세요.',
      });
      return false;
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      setErrorInfo({
        type: ErrorType.FILE_TOO_LARGE,
        message: '파일 크기는 100MB 이하여야 합니다.',
        solution: '파일 크기는 100MB 이하여야 합니다. 더 작은 파일로 시도해주세요.',
      });
      return false;
    }

    return true;
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!validateFile(file)) {
      setState('error');
      return;
    }

    setUploadedFile(file);
    setState('processing');
    setErrorInfo(null);
    setProcessingProgress(undefined);

    try {
      // pdf-lib를 동적으로 import
      const { splitPdfPages } = await import('@/lib/pdfSplitter');
      const results = await splitPdfPages(file, (current, total) => {
        setProcessingProgress({ current, total });
      });

      // 각 PDF에 썸네일 생성
      const pdfsWithThumbnails = await Promise.all(
        results.map(async (pdf) => {
          const thumbnail = await generateThumbnail(pdf.blob);
          return { ...pdf, thumbnail };
        })
      );

      setSplitPdfs(pdfsWithThumbnails);
      setState('completed');
    } catch (err) {
      const error = getErrorInfo(err);
      setErrorInfo(error);
      setState('error');
    }
  }, [validateFile]);

  const handleDownload = useCallback((pdf: SplitPdfResult) => {
    try {
      const url = URL.createObjectURL(pdf.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdf.fileName;
      link.setAttribute('aria-label', `페이지 ${pdf.pageNumber} 다운로드`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Blob URL 정리 (약간의 지연 후)
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('다운로드 중 오류 발생:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    }
  }, []);

  const handleReset = useCallback(() => {
    // 모든 Blob URL 정리
    splitPdfs.forEach((pdf) => {
      if (pdf.thumbnail) {
        URL.revokeObjectURL(pdf.thumbnail);
      }
    });
    
    setState('upload');
    setUploadedFile(null);
    setSplitPdfs([]);
    setErrorInfo(null);
    setProcessingProgress(undefined);
  }, [splitPdfs]);

  const handleRetry = useCallback(() => {
    if (uploadedFile) {
      handleFileSelect(uploadedFile);
    } else {
      handleReset();
    }
  }, [uploadedFile, handleFileSelect, handleReset]);

  // 드래그앤드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (state === 'upload') {
      setIsDragging(true);
    }
  }, [state]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (state !== 'upload') return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [state, handleFileSelect]);

  const handleClick = useCallback(() => {
    if (state === 'upload') {
      fileInputRef.current?.click();
    }
  }, [state]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    // 같은 파일을 다시 선택할 수 있도록 리셋
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

  return (
    <main 
      className="relative h-screen w-full overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={state === 'upload' ? handleClick : undefined}
    >
      {/* 3D 로봇 배경 */}
      <div className="absolute inset-0 z-0">
        <InteractiveRobotSpline
          scene={ROBOT_SCENE_URL}
          className="w-full h-full"
        />
      </div>

      {/* 컨텐츠 오버레이 */}
      <div className="relative z-10 h-full w-full overflow-auto">
        {/* 드래그 오버 시 시각적 피드백 */}
        {isDragging && state === 'upload' && (
          <div className="fixed inset-0 z-20 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary drop-shadow-lg">
                PDF 파일을 여기에 놓으세요
              </p>
            </div>
          </div>
        )}

        <div className="w-full h-full px-4 py-4 sm:py-6 md:py-8 flex flex-col">
          {/* 타이틀 - 업로드 및 처리 중 상태에서 표시 */}
          {(state === 'upload' || state === 'processing') && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-6 md:mb-8 pointer-events-none"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-lg">
                PDF 페이지 분할 서비스
              </h1>
              {state === 'upload' && (
                <p className="text-sm sm:text-base text-white/90 drop-shadow-md">
                  PDF 파일을 드래그하여 로봇 위에 놓거나 클릭하여 선택하세요
                </p>
              )}
            </motion.div>
          )}

          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="PDF 파일 선택"
          />

          <AnimatePresence mode="wait">

            {state === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-3xl mx-auto mb-6"
              >
                <Card className="bg-background/60 backdrop-blur-md border-border/50">
                  <CardContent className="pt-4 pb-4 px-6">
                    <LoadingSpinner
                      message="PDF를 분할하는 중..."
                      progress={processingProgress}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {state === 'error' && errorInfo && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 max-w-2xl mx-auto"
              >
                <ErrorMessage
                  error={errorInfo}
                  onRetry={handleRetry}
                  onReset={handleReset}
                />
              </motion.div>
            )}

            {state === 'completed' && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 bg-background/80 backdrop-blur-sm rounded-lg p-6"
              >
              {/* 새 파일 업로드 버튼 - 상단으로 이동 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center"
              >
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="lg"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  새 파일 업로드
                </Button>
              </motion.div>

              {/* Grid 레이아웃으로 PDF 페이지 표시 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <AnimatePresence>
                  {splitPdfs.map((pdf, index) => (
                    <motion.div
                      key={pdf.pageNumber}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow h-full flex flex-col bg-background/95 backdrop-blur-sm">
                        <CardContent className="p-3 flex flex-col h-full">
                          {/* PDF 썸네일 */}
                          <div className="aspect-[3/4] bg-muted rounded-md mb-3 overflow-hidden flex items-center justify-center">
                            {pdf.thumbnail ? (
                              <img
                                src={pdf.thumbnail}
                                alt={`페이지 ${pdf.pageNumber} 미리보기`}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-muted-foreground text-xs">
                                미리보기
                              </div>
                            )}
                          </div>
                          
                          {/* 페이지 번호 */}
                          <p className="text-sm font-medium text-center mb-2">
                            페이지 {pdf.pageNumber}
                          </p>
                          
                          {/* 다운로드 버튼 */}
                          <Button
                            onClick={() => handleDownload(pdf)}
                            className="w-full"
                            size="sm"
                            variant="default"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            다운로드
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

