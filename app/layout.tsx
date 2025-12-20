import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClientErrorHandler } from "@/components/ClientErrorHandler";

export const metadata: Metadata = {
  title: "PDF 페이지 분할 서비스",
  description: "PDF 파일을 각 페이지로 분할하여 다운로드하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body>
        <ErrorBoundary>
          <ClientErrorHandler>
            {children}
          </ClientErrorHandler>
        </ErrorBoundary>
      </body>
    </html>
  );
}

