'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ErrorType } from '@/lib/errorTypes';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileSelect, disabled = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // 파일 확장자 검증
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('PDF 파일만 업로드할 수 있습니다.');
      return false;
    }

    // 파일 타입 검증
    if (file.type && file.type !== 'application/pdf') {
      setError('PDF 파일만 업로드할 수 있습니다.');
      return false;
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      setError('파일 크기는 100MB 이하여야 합니다.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // 같은 파일을 다시 선택할 수 있도록 리셋
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <Card
        className={`
          relative cursor-pointer transition-all duration-200
          bg-background/95 backdrop-blur-sm
          ${isDragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-dashed'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        aria-label="PDF 파일 업로드 영역"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="p-6 sm:p-8 md:p-12 text-center">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <svg
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div>
              <p className="text-base sm:text-lg font-medium">
                PDF 파일을 드래그하거나 클릭하여 업로드하세요
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                PDF 파일만 지원됩니다 (최대 100MB)
              </p>
            </div>
          </div>
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
        aria-label="PDF 파일 선택"
      />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20"
          role="alert"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}

