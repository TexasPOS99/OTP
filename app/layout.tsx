import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Shopee Grab OTP", description: "Mobile dashboard for HeroSMS OTP activations" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
