import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClientErrorHandler } from "@/components/ClientErrorHandler";
import { I18nProvider } from "@/lib/i18n/context";
import Script from "next/script";

export const metadata: Metadata = {
  title: "PDF 페이지 분할",
  description: "PDF 파일을 각 페이지로 분할하여 다운로드하세요",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        {/* Google AdSense 스크립트 - 본인의 publisher-id로 변경하세요 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <I18nProvider>
          <ErrorBoundary>
            <ClientErrorHandler>
              {children}
            </ClientErrorHandler>
          </ErrorBoundary>
        </I18nProvider>
      </body>
    </html>
  );
}

