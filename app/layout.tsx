import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wealth Portfolio OS",
  description: "Luxury personal wealth tracking system",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        <nav className="navbar">
          <div className="max-w-[1200px] mx-auto w-full flex justify-between items-center px-4">
            <span className="navbar-title text-sm sm:text-base">Wealth Portfolio OS</span>
            <div className="flex gap-1 sm:gap-2">
              <button className="btn-glass text-xs sm:text-sm">Dashboard</button>
              <button className="btn-glass text-xs sm:text-sm">Settings</button>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
