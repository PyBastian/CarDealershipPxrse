import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getSettings } from "@/lib/data";

const geist = Geist({ subsets: ["latin"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const base = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  return { metadataBase: base, title: settings.siteTitle, description: settings.siteDescription, openGraph: { title: settings.siteTitle, description: settings.siteDescription, type: "website", locale: "es_CL" }, twitter: { card: "summary_large_image" } };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" data-scroll-behavior="smooth"><body className={geist.className}><Header/><main>{children}</main><Footer/></body></html>;
}
