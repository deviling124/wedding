import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maya & Theo — Our Wedding",
  description: "An invitation to celebrate the wedding of Maya & Theo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
