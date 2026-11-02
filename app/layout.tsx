import type { Metadata } from "next";
import { Geist, Geist_Mono, Michroma } from "next/font/google";
import { Megaphone } from "lucide-react";
import { WhatsAppSupport } from "@/components/WhatsAppSupport";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const michroma = Michroma({
  variable: "--font-michroma",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Devta",
  description: "Encontrá y contratá servicios de programación con precios y plazos claros.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} ${michroma.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="flex min-h-9 shrink-0 items-center gap-3 bg-accent-green px-3 py-1.5 font-sans text-xs font-medium text-black sm:px-6">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-black">
            <Megaphone aria-hidden="true" className="size-3.5" />
            Oferta Única
          </span>
          <span>50% OFF en todos los servicios hasta el 22/11</span>
        </div>
        {children}
        <WhatsAppSupport />
      </body>
    </html>
  );
}
