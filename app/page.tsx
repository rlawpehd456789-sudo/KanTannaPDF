'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from '@/components/FileUpload';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Upload } from 'lucide-react';
import type { SplitPdfResult } from '@/lib/pdfSplitter';
import { getErrorInfo, ErrorInfo } from '@/lib/errorTypes';
import { generateThumbnail } from '@/lib/pdfThumbnail';

type AppState = 'upload' | 'processing' | 'completed' | 'error';

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [splitPdfs, setSplitPdfs] = useState<(SplitPdfResult & { thumbnail?: string })[]>([]);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number } | null>(null);

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

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadedFile(file);
    setState('processing');
    setErrorInfo(null);
    setProcessingProgress(null);

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
  }, []);

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
    setProcessingProgress(null);
  }, [splitPdfs]);

  const handleRetry = useCallback(() => {
    if (uploadedFile) {
      handleFileSelect(uploadedFile);
    } else {
      handleReset();
    }
  }, [uploadedFile, handleFileSelect, handleReset]);

  return (
    <main className="h-screen w-full bg-background overflow-auto">
      <div className="w-full h-full px-4 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-6 md:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            PDF 페이지 분할 서비스
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            PDF 파일을 각 페이지로 분할하여 개별 다운로드하세요
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {state === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FileUpload onFileSelect={handleFileSelect} />
            </motion.div>
          )}

          {state === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="pt-6">
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
              className="space-y-4"
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
              className="space-y-6"
            >
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
                      <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
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

              {/* 새 파일 업로드 버튼 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

