'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from '@/components/FileUpload';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Download, FileText, Upload, DownloadCloud, CheckSquare, Square } from 'lucide-react';
import type { SplitPdfResult } from '@/lib/pdfSplitter';
import { getErrorInfo, ErrorInfo } from '@/lib/errorTypes';
import { downloadPdfsAsZip } from '@/lib/zipDownloader';
import { Checkbox } from '@/components/ui/checkbox';

type AppState = 'upload' | 'processing' | 'completed' | 'error';

/**
 * 파일 크기를 읽기 쉬운 형식으로 포맷팅합니다.
 * @param bytes 바이트 단위 파일 크기
 * @returns 포맷팅된 파일 크기 문자열 (예: "1.5 MB")
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [splitPdfs, setSplitPdfs] = useState<SplitPdfResult[]>([]);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  // 컴포넌트 언마운트 시 Blob URL 정리
  useEffect(() => {
    return () => {
      // Blob URL은 다운로드 시에만 생성되므로 여기서는 안전하게 처리
      // 실제 정리는 handleDownload에서 수행됨
    };
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadedFile(file);
    setState('processing');
    setErrorInfo(null);
    setProcessingProgress(null);
    setSelectedPages(new Set());

    try {
      // pdf-lib를 동적으로 import하여 초기 번들 크기 감소
      const { splitPdfPages } = await import('@/lib/pdfSplitter');
      const results = await splitPdfPages(file, (current, total) => {
        setProcessingProgress({ current, total });
      });
      setSplitPdfs(results);
      // 모든 페이지를 기본으로 선택
      setSelectedPages(new Set(results.map((pdf) => pdf.pageNumber)));
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
    // 모든 상태 초기화
    setState('upload');
    setUploadedFile(null);
    setSplitPdfs([]);
    setErrorInfo(null);
    setProcessingProgress(null);
    setSelectedPages(new Set());
    setIsDownloading(false);
  }, []);

  const handleRetry = useCallback(() => {
    if (uploadedFile) {
      handleFileSelect(uploadedFile);
    } else {
      handleReset();
    }
  }, [uploadedFile, handleFileSelect, handleReset]);

  // 전체 선택/해제
  const handleSelectAll = useCallback(() => {
    setSelectedPages((prev) => {
      if (prev.size === splitPdfs.length) {
        return new Set();
      } else {
        return new Set(splitPdfs.map((pdf) => pdf.pageNumber));
      }
    });
  }, [splitPdfs]);

  // 개별 페이지 선택/해제
  const handleTogglePage = useCallback((pageNumber: number) => {
    setSelectedPages((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(pageNumber)) {
        newSelected.delete(pageNumber);
      } else {
        newSelected.add(pageNumber);
      }
      return newSelected;
    });
  }, []);

  // 전체 다운로드
  const handleDownloadAll = useCallback(async () => {
    if (splitPdfs.length === 0) return;
    
    setIsDownloading(true);
    try {
      const originalFileName = uploadedFile?.name.replace(/\.pdf$/i, '') || 'pdf_pages';
      await downloadPdfsAsZip(splitPdfs, `${originalFileName}_all_pages.zip`);
    } catch (error) {
      console.error('다운로드 중 오류 발생:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsDownloading(false);
    }
  }, [splitPdfs.length, splitPdfs, uploadedFile]);

  // 선택한 페이지 다운로드
  const selectedPdfs = useMemo(() => {
    return splitPdfs.filter((pdf) => selectedPages.has(pdf.pageNumber));
  }, [splitPdfs, selectedPages]);

  const handleDownloadSelected = useCallback(async () => {
    if (selectedPages.size === 0) {
      alert('다운로드할 페이지를 선택해주세요.');
      return;
    }

    setIsDownloading(true);
    try {
      const originalFileName = uploadedFile?.name.replace(/\.pdf$/i, '') || 'pdf_pages';
      await downloadPdfsAsZip(selectedPdfs, `${originalFileName}_selected_pages.zip`);
    } catch (error) {
      console.error('다운로드 중 오류 발생:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsDownloading(false);
    }
  }, [selectedPages.size, selectedPdfs, uploadedFile]);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 max-w-4xl">
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
              className="space-y-4"
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

          {state === 'completed' && uploadedFile && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 md:space-y-6"
            >
              <Card className="border-green-500/50 bg-green-500/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-green-600">분할 완료!</CardTitle>
                  </div>
                  <CardDescription className="mt-2">
                    PDF가 성공적으로 분할되었습니다. 총 {splitPdfs.length}개의 페이지를 다운로드할 수 있습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-md">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        <span>크기: {formatFileSize(uploadedFile.size)}</span>
                        <span>•</span>
                        <span>페이지: {splitPdfs.length}개</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold">다운로드할 페이지 선택</h2>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button
                      onClick={handleDownloadAll}
                      disabled={isDownloading || splitPdfs.length === 0}
                      variant="default"
                      size="sm"
                      className="flex-1 sm:flex-initial"
                      aria-label="전체 페이지 다운로드"
                    >
                      {isDownloading ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          처리 중...
                        </>
                      ) : (
                        <>
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          전체 다운로드
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDownloadSelected}
                      disabled={isDownloading || selectedPages.size === 0}
                      variant="secondary"
                      size="sm"
                      className="flex-1 sm:flex-initial"
                      aria-label={`선택한 ${selectedPages.size}개 페이지 다운로드`}
                    >
                      {isDownloading ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          처리 중...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          선택 다운로드 ({selectedPages.size})
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center gap-2 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                        type="button"
                        aria-label={selectedPages.size === splitPdfs.length ? '전체 선택 해제' : '전체 선택'}
                      >
                        {selectedPages.size === splitPdfs.length ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                        <span className="text-sm font-medium">
                          전체 {selectedPages.size === splitPdfs.length ? '해제' : '선택'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({selectedPages.size} / {splitPdfs.length})
                        </span>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-2 sm:gap-3">
                  <AnimatePresence>
                    {splitPdfs.map((pdf, index) => (
                      <motion.div
                        key={pdf.pageNumber}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <Card className={`hover:shadow-md transition-shadow ${selectedPages.has(pdf.pageNumber) ? 'border-primary' : ''}`}>
                          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Checkbox
                                checked={selectedPages.has(pdf.pageNumber)}
                                onCheckedChange={() => handleTogglePage(pdf.pageNumber)}
                                id={`page-${pdf.pageNumber}`}
                                aria-label={`페이지 ${pdf.pageNumber} 선택`}
                              />
                              <label
                                htmlFor={`page-${pdf.pageNumber}`}
                                className="flex-1 min-w-0 cursor-pointer focus:outline-none"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleTogglePage(pdf.pageNumber);
                                  }
                                }}
                              >
                                <p className="font-medium">페이지 {pdf.pageNumber}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {pdf.fileName}
                                </p>
                              </label>
                            </div>
                            <Button
                              onClick={() => handleDownload(pdf)}
                              className="w-full sm:w-auto"
                              size="sm"
                              variant="outline"
                              aria-label={`페이지 ${pdf.pageNumber} 다운로드`}
                            >
                              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                              개별 다운로드
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                  size="lg"
                  aria-label="새 파일 업로드"
                >
                  <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
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

