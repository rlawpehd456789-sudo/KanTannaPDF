/**
 * 에러 타입 정의
 */
export enum ErrorType {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  CORRUPTED_PDF = 'CORRUPTED_PDF',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  solution?: string;
}

/**
 * 에러 타입별 메시지 및 해결 방법
 */
export const ERROR_MESSAGES: Record<ErrorType, ErrorInfo> = {
  [ErrorType.INVALID_FILE_TYPE]: {
    type: ErrorType.INVALID_FILE_TYPE,
    message: '잘못된 파일 형식입니다.',
    solution: 'PDF 파일만 업로드할 수 있습니다. 파일 형식을 확인해주세요.',
  },
  [ErrorType.FILE_TOO_LARGE]: {
    type: ErrorType.FILE_TOO_LARGE,
    message: '파일 크기가 너무 큽니다.',
    solution: '파일 크기는 100MB 이하여야 합니다. 더 작은 파일로 시도해주세요.',
  },
  [ErrorType.CORRUPTED_PDF]: {
    type: ErrorType.CORRUPTED_PDF,
    message: '손상된 PDF 파일입니다.',
    solution: 'PDF 파일이 손상되었을 수 있습니다. 다른 PDF 파일로 시도해주세요.',
  },
  [ErrorType.PROCESSING_ERROR]: {
    type: ErrorType.PROCESSING_ERROR,
    message: 'PDF 처리 중 오류가 발생했습니다.',
    solution: '파일을 다시 업로드하거나 다른 PDF 파일로 시도해주세요.',
  },
  [ErrorType.MEMORY_ERROR]: {
    type: ErrorType.MEMORY_ERROR,
    message: '메모리 부족으로 처리할 수 없습니다.',
    solution: '더 작은 PDF 파일로 시도하거나 브라우저를 재시작해주세요.',
  },
  [ErrorType.UNKNOWN_ERROR]: {
    type: ErrorType.UNKNOWN_ERROR,
    message: '알 수 없는 오류가 발생했습니다.',
    solution: '페이지를 새로고침하거나 잠시 후 다시 시도해주세요.',
  },
};

/**
 * 에러 메시지에서 에러 타입을 추출하거나 기본 에러 정보를 반환
 */
export function getErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('invalid') || errorMessage.includes('format')) {
      return ERROR_MESSAGES[ErrorType.INVALID_FILE_TYPE];
    }
    if (errorMessage.includes('large') || errorMessage.includes('size')) {
      return ERROR_MESSAGES[ErrorType.FILE_TOO_LARGE];
    }
    if (errorMessage.includes('corrupt') || errorMessage.includes('damaged')) {
      return ERROR_MESSAGES[ErrorType.CORRUPTED_PDF];
    }
    if (errorMessage.includes('memory') || errorMessage.includes('out of memory')) {
      return ERROR_MESSAGES[ErrorType.MEMORY_ERROR];
    }
    if (errorMessage.includes('processing') || errorMessage.includes('parse')) {
      return ERROR_MESSAGES[ErrorType.PROCESSING_ERROR];
    }
  }
  
  return ERROR_MESSAGES[ErrorType.UNKNOWN_ERROR];
}

