import { PDFDocument } from 'pdf-lib';
import { ErrorType } from './errorTypes';

export interface MergePdfResult {
  blob: Blob;
  fileName: string;
  totalPages: number;
}

export type MergeProgressCallback = (current: number, total: number) => void;

const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB (여러 파일 합계)

/**
 * 여러 PDF 파일을 하나로 병합합니다.
 * @param files 병합할 PDF 파일 배열
 * @param onProgress 진행률 콜백 함수 (선택사항)
 * @returns 병합된 PDF 결과
 */
export async function mergePdfFiles(
  files: File[],
  onProgress?: MergeProgressCallback
): Promise<MergePdfResult> {
  try {
    // 파일 개수 검증
    if (files.length === 0) {
      const error = new Error('병합할 파일이 없습니다.');
      (error as any).type = ErrorType.INVALID_FILE_TYPE;
      throw error;
    }

    if (files.length === 1) {
      const error = new Error('병합하려면 최소 2개 이상의 파일이 필요합니다.');
      (error as any).type = ErrorType.INVALID_FILE_TYPE;
      throw error;
    }

    // 총 파일 크기 검증
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      const error = new Error('모든 파일의 총 크기가 너무 큽니다.');
      (error as any).type = ErrorType.FILE_TOO_LARGE;
      throw error;
    }

    // 메모리 사용량 체크 (브라우저 지원 시)
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const availableMB = (memory.jsHeapSizeLimit - memory.usedJSHeapSize) / 1048576;
      const totalSizeMB = totalSize / 1048576;
      
      // 파일 크기가 사용 가능한 메모리의 50%를 초과하면 경고
      if (totalSizeMB > availableMB * 0.5) {
        console.warn(`대용량 파일 병합 중: ${totalSizeMB.toFixed(2)}MB (사용 가능 메모리: ${availableMB.toFixed(2)}MB)`);
      }
    }

    // 새 PDF 문서 생성
    const mergedPdf = await PDFDocument.create();
    let totalPages = 0;

    // 각 파일을 순회하며 페이지 복사
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 파일을 ArrayBuffer로 변환
      const arrayBuffer = await file.arrayBuffer();
      
      // PDF 로드
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      // 모든 페이지 복사
      const pages = await mergedPdf.copyPages(pdfDoc, 
        Array.from({ length: pageCount }, (_, i) => i)
      );
      
      // 복사한 페이지들을 새 PDF에 추가
      pages.forEach((page) => {
        mergedPdf.addPage(page);
      });
      
      totalPages += pageCount;
      
      // 진행률 업데이트
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }

    // 병합된 PDF 바이트 생성
    const pdfBytes = await mergedPdf.save();
    
    // Blob으로 변환
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // 파일명 생성 (첫 번째 파일명 기반)
    const firstFileName = files[0].name.replace(/\.pdf$/i, '');
    const fileName = `${firstFileName}_merged.pdf`;

    return {
      blob,
      fileName,
      totalPages,
    };
  } catch (error) {
    // 이미 타입이 지정된 에러는 그대로 전달
    if (error instanceof Error && (error as any).type) {
      throw error;
    }
    
    // PDF 파싱 에러 처리
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('parse') || errorMessage.includes('invalid')) {
        const parseError = new Error('손상된 PDF 파일이 포함되어 있습니다.');
        (parseError as any).type = ErrorType.CORRUPTED_PDF;
        throw parseError;
      }
      
      const processingError = new Error(`PDF 병합 중 오류가 발생했습니다: ${error.message}`);
      (processingError as any).type = ErrorType.PROCESSING_ERROR;
      throw processingError;
    }
    
    const unknownError = new Error('PDF 병합 중 알 수 없는 오류가 발생했습니다.');
    (unknownError as any).type = ErrorType.UNKNOWN_ERROR;
    throw unknownError;
  }
}

