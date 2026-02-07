'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Upload, GripVertical, X } from 'lucide-react';
import type { SplitPdfResult } from '@/lib/pdfSplitter';
import type { MergePdfResult } from '@/lib/pdfMerger';
import { getErrorInfo, ErrorInfo, ErrorType } from '@/lib/errorTypes';
import { generateThumbnail } from '@/lib/pdfThumbnail';
import { InteractiveRobotSpline } from '@/components/ui/interactive-3d-robot';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSelector } from '@/components/LanguageSelector';

type AppMode = 'split' | 'merge';
type AppState = 'upload' | 'file-selected' | 'processing' | 'completed' | 'error';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function Home() {
  const { t, language } = useI18n();
  const [mode, setMode] = useState<AppMode>('split');
  const [state, setState] = useState<AppState>('upload');

  // 페이지 제목 동적 업데이트
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = t('metadata.title');
    }
  }, [language, t]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [splitPdfs, setSplitPdfs] = useState<(SplitPdfResult & { thumbnail?: string })[]>([]);
  const [mergedPdf, setMergedPdf] = useState<MergePdfResult | null>(null);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number } | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 컴포넌트 언마운트 시 Blob URL 정리
  useEffect(() => {
    return () => {
      splitPdfs.forEach((pdf) => {
        if (pdf.thumbnail) {
          URL.revokeObjectURL(pdf.thumbnail);
        }
      });
      if (mergedPdf) {
        // 병합된 PDF의 Blob URL은 다운로드 시 생성되므로 여기서는 정리하지 않음
      }
    };
  }, [splitPdfs, mergedPdf]);

  const validateFile = useCallback((file: File): boolean => {
    // 파일 확장자 검증
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorInfo({
        type: ErrorType.INVALID_FILE_TYPE,
        message: t('error.invalidFileType'),
        solution: t('error.invalidFileTypeSolution'),
      });
      return false;
    }

    // 파일 타입 검증
    if (file.type && file.type !== 'application/pdf') {
      setErrorInfo({
        type: ErrorType.INVALID_FILE_TYPE,
        message: t('error.invalidFileType'),
        solution: t('error.invalidFileTypeSolution'),
      });
      return false;
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      setErrorInfo({
        type: ErrorType.FILE_TOO_LARGE,
        message: t('error.fileTooLarge'),
        solution: t('error.fileTooLargeSolution'),
      });
      return false;
    }

    return true;
  }, [t]);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (mode === 'split') {
      // 분할 모드: 단일 파일 처리
      const file = files[0];
      if (!validateFile(file)) {
        setState('error');
        return;
      }

      setUploadedFile(file);
      setUploadedFiles([]);
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
        setMergedPdf(null);
        setState('completed');
      } catch (err) {
        const error = getErrorInfo(err);
        setErrorInfo(error);
        setState('error');
      }
    } else {
      // 병합 모드: 여러 파일 처리
      const validFiles = files.filter(file => validateFile(file));
      if (validFiles.length < 2) {
        setErrorInfo({
          type: ErrorType.INVALID_FILE_TYPE,
          message: t('error.minFilesRequired'),
          solution: t('error.minFilesRequiredSolution'),
        });
        setState('error');
        return;
      }

      setUploadedFile(null);
      setUploadedFiles(validFiles);
      setState('file-selected');
      setErrorInfo(null);
      setProcessingProgress(undefined);
    }
  }, [mode, validateFile]);

  const handleDownload = useCallback((pdf: SplitPdfResult) => {
    try {
      // Google AdSense 광고 트리거
      if (typeof window !== 'undefined') {
        try {
          // AdSense 광고를 로드하거나 새로고침
          if ((window as any).adsbygoogle) {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          }
        } catch (e) {
          console.error('광고 로드 오류:', e);
        }
      }

      const url = URL.createObjectURL(pdf.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdf.fileName;
      link.setAttribute('aria-label', t('aria.downloadPage', { number: pdf.pageNumber }));
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Blob URL 정리 (약간의 지연 후)
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('다운로드 중 오류 발생:', error);
      alert(t('error.downloadError'));
    }
  }, [t]);

  const handleReset = useCallback(() => {
    // 모든 Blob URL 정리
    splitPdfs.forEach((pdf) => {
      if (pdf.thumbnail) {
        URL.revokeObjectURL(pdf.thumbnail);
      }
    });
    
    setState('upload');
    setUploadedFile(null);
    setUploadedFiles([]);
    setSplitPdfs([]);
    setMergedPdf(null);
    setErrorInfo(null);
    setProcessingProgress(undefined);
  }, [splitPdfs]);

  const handleRetry = useCallback(() => {
    if (mode === 'split' && uploadedFile) {
      handleFileSelect([uploadedFile]);
    } else if (mode === 'merge' && uploadedFiles.length > 0) {
      handleFileSelect(uploadedFiles);
    } else {
      handleReset();
    }
  }, [mode, uploadedFile, uploadedFiles, handleFileSelect, handleReset, t]);

  // 병합 실행 함수
  const handleMerge = useCallback(async () => {
    if (uploadedFiles.length < 2) {
      setErrorInfo({
        type: ErrorType.INVALID_FILE_TYPE,
        message: t('error.minFilesRequired'),
        solution: t('error.minFilesRequiredSolution'),
      });
      setState('error');
      return;
    }

    setState('processing');
    setErrorInfo(null);
    setProcessingProgress(undefined);

    try {
      const { mergePdfFiles } = await import('@/lib/pdfMerger');
      const result = await mergePdfFiles(uploadedFiles, (current, total) => {
        setProcessingProgress({ current, total });
      });

      setMergedPdf(result);
      setSplitPdfs([]);
      setState('completed');
    } catch (err) {
      const error = getErrorInfo(err);
      setErrorInfo(error);
      setState('error');
    }
  }, [uploadedFiles, t]);

  // 파일 순서 변경 함수
  const moveFile = useCallback((fromIndex: number, toIndex: number) => {
    const newFiles = [...uploadedFiles];
    const [removed] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, removed);
    setUploadedFiles(newFiles);
  }, [uploadedFiles]);

  // 파일 제거 함수
  const removeFile = useCallback((index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    if (newFiles.length < 2) {
      setState('upload');
    }
  }, [uploadedFiles]);

  // 파일 목록 드래그 핸들러
  const handleFileDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleFileDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleFileDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveFile(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, moveFile]);

  // 드래그앤드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (state === 'upload' || state === 'file-selected') {
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

    // 파일 목록 드래그 중이면 무시
    if (draggedIndex !== null) return;

    if (state !== 'upload' && state !== 'file-selected') return;

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.name.toLowerCase().endsWith('.pdf')
    );
    
    if (files.length > 0) {
      if (mode === 'split') {
        handleFileSelect([files[0]]);
      } else {
        // 병합 모드: 기존 파일에 추가
        if (state === 'file-selected') {
          const newFiles = [...uploadedFiles, ...files];
          setUploadedFiles(newFiles);
        } else {
          handleFileSelect(files);
        }
      }
    }
  }, [state, mode, handleFileSelect, draggedIndex, uploadedFiles]);

  const handleClick = useCallback(() => {
    if (state === 'upload' || (state === 'file-selected' && mode === 'merge')) {
      fileInputRef.current?.click();
    }
  }, [state, mode]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      if (mode === 'merge' && state === 'file-selected') {
        // 병합 모드에서 파일이 이미 선택된 경우 추가
        const newFiles = [...uploadedFiles, ...fileArray];
        setUploadedFiles(newFiles);
      } else {
        handleFileSelect(fileArray);
      }
    }
    // 같은 파일을 다시 선택할 수 있도록 리셋
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect, mode, state, uploadedFiles]);

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
        {isDragging && (state === 'upload' || state === 'file-selected') && draggedIndex === null && (
          <div className="fixed inset-0 z-20 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary drop-shadow-lg">
                {mode === 'split' 
                  ? t('dragDrop.split')
                  : state === 'file-selected'
                  ? t('dragDrop.mergeAdd')
                  : t('dragDrop.merge')
                }
              </p>
            </div>
          </div>
        )}

        <div className="w-full h-full px-4 pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 flex flex-col justify-start">
          {/* 로고 - 좌측 상단 (absolute positioning) */}
          <div className="absolute top-2 left-4 sm:top-3 sm:left-6 md:top-4 md:left-8 z-30 pointer-events-none">
            <img 
              src="/Copilot_20251221_093546.png" 
              alt="KanTanna PDF Logo" 
              className="h-[150px] w-auto object-contain drop-shadow-lg"
            />
          </div>
          
          {/* 언어 선택기 - 우측 상단 */}
          <div className="flex justify-end mb-2 pointer-events-auto z-30 pr-8">
            <LanguageSelector />
          </div>

          {/* 타이틀 - 업로드, 파일 선택, 처리 중 상태에서 표시 */}
          {(state === 'upload' || state === 'file-selected' || state === 'processing') && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-2 md:mb-3"
            >
              {/* 모드 선택 버튼 */}
              {(state === 'upload' || state === 'file-selected') && (
                <div className="flex gap-4 justify-center mb-2 pointer-events-auto">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMode('split');
                      handleReset();
                    }}
                    variant={mode === 'split' ? 'default' : 'outline'}
                    size="lg"
                    className="pointer-events-auto"
                  >
                    {t('mode.split')}
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMode('merge');
                      handleReset();
                    }}
                    variant={mode === 'merge' ? 'default' : 'outline'}
                    size="lg"
                    className="pointer-events-auto"
                  >
                    {t('mode.merge')}
                  </Button>
                </div>
              )}
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-lg pointer-events-none">
                {mode === 'split' ? t('title.split') : t('title.merge')}
              </h1>
              {state === 'upload' && (
                <p className="text-sm sm:text-base text-white/90 drop-shadow-md pointer-events-none">
                  {mode === 'split' 
                    ? t('description.split')
                    : t('description.merge')
                  }
                </p>
              )}
              {state === 'file-selected' && mode === 'merge' && (
                <p className="text-sm sm:text-base text-white/90 drop-shadow-md pointer-events-none">
                  {t('description.mergeFileSelected')}
                </p>
              )}
            </motion.div>
          )}

          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple={mode === 'merge'}
            onChange={handleFileInputChange}
            className="hidden"
            aria-label={mode === 'split' ? t('aria.selectFile') : t('aria.selectFiles')}
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
                      message={mode === 'split' ? t('processing.splitting') : t('processing.merging')}
                      progress={processingProgress}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {state === 'file-selected' && mode === 'merge' && (
              <motion.div
                key="file-selected"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 bg-background/80 backdrop-blur-sm rounded-lg p-6 max-w-3xl mx-auto"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">
                    {t('merge.fileList')}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t('merge.fileListDescription')}
                  </p>
                </div>

                {/* 파일 목록 */}
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <motion.div
                      key={`${file.name}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      draggable
                      onDragStart={() => handleFileDragStart(index)}
                      onDragOver={(e) => handleFileDragOver(e, index)}
                      onDragLeave={handleFileDragLeave}
                      onDrop={(e) => handleFileDrop(e, index)}
                      className={`
                        flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                        ${draggedIndex === index ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}
                        ${dragOverIndex === index ? 'border-primary bg-primary/10' : 'border-border bg-background/95'}
                        hover:border-primary/50
                      `}
                    >
                      {/* 드래그 핸들 */}
                      <div className="text-muted-foreground hover:text-foreground">
                        <GripVertical className="h-5 w-5" />
                      </div>

                      {/* 순서 번호 */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>

                      {/* 파일 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      {/* 제거 버튼 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="flex-shrink-0"
                        aria-label={t('aria.removeFile', { fileName: file.name })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>

                {/* 액션 버튼 */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <Button
                    onClick={handleMerge}
                    size="lg"
                    disabled={uploadedFiles.length < 2}
                    className="w-full sm:w-auto"
                  >
                    {t('merge.mergeButton', { count: uploadedFiles.length })}
                  </Button>
                  <Button
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t('common.addFile')}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {t('common.reset')}
                  </Button>
                </div>
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

            {state === 'completed' && mode === 'split' && (
              <motion.div
                key="completed-split"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-6xl mx-auto mt-40 sm:mt-48 md:mt-56 mb-8 space-y-6 bg-background/80 backdrop-blur-sm rounded-lg p-6"
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
                  {t('common.newFileUpload')}
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
                                alt={t('split.pageNumber', { number: pdf.pageNumber }) + ' ' + t('common.preview')}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-muted-foreground text-xs">
                                {t('common.preview')}
                              </div>
                            )}
                          </div>
                          
                          {/* 페이지 번호 */}
                          <p className="text-sm font-medium text-center mb-2">
                            {t('split.pageNumber', { number: pdf.pageNumber })}
                          </p>
                          
                          {/* 다운로드 버튼 */}
                          <Button
                            onClick={() => handleDownload(pdf)}
                            className="w-full"
                            size="sm"
                            variant="default"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {t('common.download')}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
            )}

            {state === 'completed' && mode === 'merge' && mergedPdf && (
              <motion.div
                key="completed-merge"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-2xl mx-auto mt-40 sm:mt-48 md:mt-56 mb-8 space-y-6 bg-background/80 backdrop-blur-sm rounded-lg p-6"
              >
                <div className="text-center">
                  <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl sm:text-3xl font-bold mb-2"
                  >
                    {t('merge.completed')}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-muted-foreground mb-6"
                  >
                    {t('merge.totalPages', { total: mergedPdf.totalPages })}
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                  >
                    <Button
                      onClick={() => {
                        try {
                          const url = URL.createObjectURL(mergedPdf.blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = mergedPdf.fileName;
                          link.setAttribute('aria-label', t('aria.downloadMerged'));
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          setTimeout(() => URL.revokeObjectURL(url), 100);
                        } catch (error) {
                          console.error('다운로드 중 오류 발생:', error);
                          alert(t('error.downloadError'));
                        }
                      }}
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('merge.downloadMerged')}
                    </Button>
                    
                    <div>
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {t('common.newFileUpload')}
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

