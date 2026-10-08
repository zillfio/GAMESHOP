import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { StoreProvider } from "@/components/store/store-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GAMESHOP | Игровые товары и безопасные покупки",
  description: "Покупайте игровую валюту, предметы, аккаунты и цифровые товары с защитой сделки в Кыргызстане.",
  metadataBase: new URL("https://gameshop.example"),
  openGraph: {
    title: "GAMESHOP",
    description: "Современная платформа для безопасных покупок цифровых игровых товаров.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-950 text-white">
        <AuthProvider>
          <StoreProvider>
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
