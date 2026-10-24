import type { Metadata } from "next";
import { Inter, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Meaify — Multimodal Education AI",
  description:
    "Grade handwritten answer sheets with vision OCR, rubric scoring, and AI feedback. Voice-enabled rubric assistant. Built with Groq, Gemini, and Hugging Face.",
  keywords: [
    "Meaify",
    "Multimodal Education AI",
    "AI grading",
    "OCR",
    "handwriting",
    "rubric",
    "education",
    "Groq",
    "Gemini",
  ],
  authors: [{ name: "Meaify" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Meaify — Multimodal Education AI",
    description:
      "Vision OCR → rubric grading → AI feedback → voice chatbot. Built with Next.js, Groq, and Gemini.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meaify",
    description: "Multimodal Education AI for handwritten answer grading.",
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
        className={`${inter.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster
          theme="light"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--popover)",
              border: "1px solid var(--border)",
              color: "var(--popover-foreground)",
              borderRadius: "var(--radius-md)",
            },
          }}
        />
      </body>
    </html>
  );
}
