import { PDFDocument } from 'pdf-lib';
import { ErrorType } from './errorTypes';

export interface SplitPdfResult {
  pageNumber: number;
  blob: Blob;
  fileName: string;
}

export type ProgressCallback = (current: number, total: number) => void;

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * PDF 파일을 각 페이지로 분할합니다.
 * @param file 업로드된 PDF 파일
 * @param onProgress 진행률 콜백 함수 (선택사항)
 * @returns 분할된 PDF 페이지 배열
 */
export async function splitPdfPages(
  file: File,
  onProgress?: ProgressCallback
): Promise<SplitPdfResult[]> {
  try {
    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      const error = new Error('파일 크기가 너무 큽니다.');
      (error as any).type = ErrorType.FILE_TOO_LARGE;
      throw error;
    }

    // File을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    
    // 메모리 사용량 체크 (브라우저 지원 시)
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const availableMB = (memory.jsHeapSizeLimit - memory.usedJSHeapSize) / 1048576;
      const fileSizeMB = file.size / 1048576;
      
      // 파일 크기가 사용 가능한 메모리의 50%를 초과하면 경고
      if (fileSizeMB > availableMB * 0.5) {
        console.warn(`대용량 파일 처리 중: ${fileSizeMB.toFixed(2)}MB (사용 가능 메모리: ${availableMB.toFixed(2)}MB)`);
      }
    }
    
    // PDF 로드
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = pdfDoc.getPageCount();
    
    // 원본 파일명에서 확장자 제거
    const originalFileName = file.name.replace(/\.pdf$/i, '');
    
    // 각 페이지를 독립 PDF로 분할
    const splitPdfs: SplitPdfResult[] = [];
    
    for (let i = 0; i < totalPages; i++) {
      // 새 PDF 문서 생성
      const newPdf = await PDFDocument.create();
      
      // 원본 PDF에서 페이지 복사
      const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(copiedPage);
      
      // PDF 바이트 생성
      const pdfBytes = await newPdf.save();
      
      // Blob으로 변환
      const blob = new Blob([pdfBytes] as BlobPart[], { type: 'application/pdf' });
      
      // 파일명 생성 (01, 02 형식으로 패딩)
      const pageNumber = i + 1;
      const paddedPageNumber = pageNumber.toString().padStart(2, '0');
      const fileName = `${originalFileName}_page_${paddedPageNumber}.pdf`;
      
      splitPdfs.push({
        pageNumber,
        blob,
        fileName,
      });
      
      // 진행률 업데이트
      if (onProgress) {
        onProgress(i + 1, totalPages);
      }
    }
    
    return splitPdfs;
  } catch (error) {
    // 이미 타입이 지정된 에러는 그대로 전달
    if (error instanceof Error && (error as any).type) {
      throw error;
    }
    
    // PDF 파싱 에러 처리
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('parse') || errorMessage.includes('invalid')) {
        const parseError = new Error('손상된 PDF 파일입니다.');
        (parseError as any).type = ErrorType.CORRUPTED_PDF;
        throw parseError;
      }
      
      const processingError = new Error(`PDF 처리 중 오류가 발생했습니다: ${error.message}`);
      (processingError as any).type = ErrorType.PROCESSING_ERROR;
      throw processingError;
    }
    
    const unknownError = new Error('PDF 처리 중 알 수 없는 오류가 발생했습니다.');
    (unknownError as any).type = ErrorType.UNKNOWN_ERROR;
    throw unknownError;
  }
}

