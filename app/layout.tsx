import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://wedding.fenatti.me"),
  title: "Adrian & KC — Our Wedding",
  description: "An invitation to celebrate the wedding of Adrian & KC.",
  alternates: {
    canonical: "https://wedding.fenatti.me/",
  },
  openGraph: {
    title: "Adrian & KC — Our Wedding",
    description: "An invitation to celebrate the wedding of Adrian & KC.",
    url: "https://wedding.fenatti.me/",
    siteName: "Adrian & KC — Our Wedding",
    type: "website",
    images: [
      {
        url: "/og-wedding.webp",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Adrian and KC wedding invitation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adrian & KC — Our Wedding",
    description: "An invitation to celebrate the wedding of Adrian & KC.",
    images: ["/og-wedding.webp"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

