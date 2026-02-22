import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniAgent",
  description: "The AI Agent Platform with Built-in Economy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-dark-bg text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
