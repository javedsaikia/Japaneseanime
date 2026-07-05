import type { Metadata, Viewport } from "next";
import { Righteous, Poppins } from "next/font/google";
import "./globals.css";

// Display face — bold, energetic, "entertainment" mood (from the skill's
// Righteous / Poppins recommendation).
const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-righteous",
  display: "swap",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AKATSUKI STUDIO — Where Legends Are Drawn",
  description:
    "A modern Japanese animation studio. Cinematic worlds, unforgettable heroes. Experience the hero in gaze, gesture, or touch.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0618",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${righteous.variable} ${poppins.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
