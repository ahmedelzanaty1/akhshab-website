import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "أخشاب | AKHSHAB — تصميم أثاث بالتفصيل",
  description: "بنصمم ونصنّع قطع أثاث من خشب حقيقي، بمراجعة دقيقة لكل قياس ولكل خامة.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800;900&family=Tajawal:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
