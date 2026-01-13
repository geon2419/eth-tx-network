import type { Metadata } from "next";
import localFont from "next/font/local";

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
  title: "Ethereum Address Transaction Network",
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
        <ErrorBoundary>
          <SidebarLayout>{children}</SidebarLayout>
        </ErrorBoundary>
      </body>
    </html>
  );
}
