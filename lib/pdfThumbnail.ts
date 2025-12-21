/**
 * PDF Blob에서 첫 페이지의 썸네일 이미지를 생성합니다.
 * @param pdfBlob PDF 파일의 Blob
 * @param maxWidth 썸네일 최대 너비 (기본값: 200)
 * @returns 썸네일 이미지의 Data URL
 */
export async function generateThumbnail(
  pdfBlob: Blob,
  maxWidth: number = 200
): Promise<string> {
  // 브라우저 환경에서만 실행
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    // pdfjs-dist를 동적으로 import (클라이언트 사이드에서만 로드)
    const pdfjsLib = await import('pdfjs-dist');
    
    // Worker 설정 - 로컬 파일 사용
    // Next.js public 폴더의 파일은 루트 경로로 제공됨
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    
    // Blob을 ArrayBuffer로 변환
    const arrayBuffer = await pdfBlob.arrayBuffer();
    
    // PDF 로드
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // 첫 페이지 가져오기
    const page = await pdf.getPage(1);
    
    // 뷰포트 계산 (비율 유지)
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = maxWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });
    
    // Canvas 생성
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Canvas context를 가져올 수 없습니다.');
    }
    
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    
    // PDF 페이지를 Canvas에 렌더링
    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
      canvas: canvas,
    }).promise;
    
    // Canvas를 Data URL로 변환
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('썸네일 생성 중 오류:', error);
    // 에러 발생 시 빈 이미지 반환
    return '';
  }
}

