import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";

import { SidebarLayout, ErrorBoundary } from "@/shared/ui";

import "./globals.css";

const pretendard = localFont({
  src: [
    {
      path: "../public/fonts/Pretendard-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Pretendard-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Pretendard-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ethereum Transaction Network",
  description: "Force-directed visualization of Ethereum address flows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pretendard.variable} antialiased`}>
        {process.env.NODE_ENV === "production" && (
          <>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-9XG0SSFGNG"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-9XG0SSFGNG');
              `}
            </Script>
          </>
        )}

        <ErrorBoundary>
          <SidebarLayout>{children}</SidebarLayout>
        </ErrorBoundary>
      </body>
    </html>
  );
}
