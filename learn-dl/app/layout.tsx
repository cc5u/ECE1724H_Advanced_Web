import type { Metadata } from "next";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Learn DL",
  description: "Train, predict, and manage deep learning models in one Next.js app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
