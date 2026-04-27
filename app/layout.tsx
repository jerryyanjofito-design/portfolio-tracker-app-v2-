import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wealth Portfolio OS",
  description: "Luxury personal wealth tracking system",
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
          <div className="max-w-[1200px] mx-auto w-full flex justify-between items-center">
            <span className="navbar-title">Wealth Portfolio OS</span>
            <div className="flex gap-2">
              <button className="btn-glass">Dashboard</button>
              <button className="btn-glass">Settings</button>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
