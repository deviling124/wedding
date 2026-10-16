import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adrian & KC — Our Wedding",
  description: "An invitation to celebrate the wedding of Adrian & KC.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
