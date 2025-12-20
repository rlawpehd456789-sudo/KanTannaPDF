import JSZip from 'jszip';
import { SplitPdfResult } from './pdfSplitter';

/**
 * 선택한 PDF 페이지들을 ZIP 파일로 다운로드합니다.
 * @param pdfs 다운로드할 PDF 배열
 * @param zipFileName ZIP 파일명
 */
export async function downloadPdfsAsZip(
  pdfs: SplitPdfResult[],
  zipFileName: string = 'pdf_pages.zip'
): Promise<void> {
  const zip = new JSZip();

  // 각 PDF를 ZIP에 추가
  for (const pdf of pdfs) {
    const arrayBuffer = await pdf.blob.arrayBuffer();
    zip.file(pdf.fileName, arrayBuffer);
  }

  // ZIP 파일 생성
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  // 다운로드
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Blob URL 정리
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

