import type { Metadata } from "next";
import { Geist, Geist_Mono, Belleza } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const belleza = Belleza({
  variable: "--font-belleza",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MEAIFY — Handwritten Answer Grading",
  description:
    "Upload a handwritten answer sheet, run OCR with vision models, and get AI-assisted grading with a rubric, semantic similarity, and AI feedback. Includes a voice-enabled rubric assistant.",
  keywords: [
    "AI grading",
    "OCR",
    "handwriting",
    "rubric",
    "education",
    "Groq",
    "Gemini",
  ],
  authors: [{ name: "MEAIFY" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "MEAIFY — Handwritten Answer Grading",
    description:
      "Vision OCR → rubric grading → AI feedback → voice chatbot. Built with Next.js, Groq, and Gemini.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MEAIFY",
    description: "Handwritten answer grading with vision models.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${belleza.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
