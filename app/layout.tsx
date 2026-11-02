import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://wedding-rsvp-eight-zeta.vercel.app"),
  title: "Adrian & KC — Our Wedding",
  description: "An invitation to celebrate the wedding of Adrian & KC.",
  openGraph: {
    title: "Adrian & KC — Our Wedding",
    description: "An invitation to celebrate the wedding of Adrian & KC.",
    url: "https://wedding-rsvp-eight-zeta.vercel.app",
    siteName: "Adrian & KC — Our Wedding",
    type: "website",
    images: [
      {
          url: "/landing-page-preview.png",
          width: 802,
          height: 635,
          alt: "Adrian and KC wedding invitation landing page",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adrian & KC — Our Wedding",
    description: "An invitation to celebrate the wedding of Adrian & KC.",
      images: ["/landing-page-preview.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

